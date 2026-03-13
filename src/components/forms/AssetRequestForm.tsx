"use client";

import { useState, useEffect } from "react";
import { Loader2, Phone, Mail, Globe, MapPin, Download, Printer, Package } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFormAutoFill } from "@/_core/hooks/useFormAutoFill";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

/**
 * AssetRequestForm - Dynamic Asset/Property Approval Workflow
 * Logo header, yellow title bar, Section/Row layout, actions bar, footer
 */

interface Props {
    requestData?: any;
    isReadOnly?: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
    onBack?: () => void;
}

export default function AssetRequestForm({ requestData, isReadOnly = false, onSuccess, onClose, onBack }: Props) {
    const { user, isAuthenticated } = useAuth();
    const autoFillData = useFormAutoFill();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        requestNumber: "",
        employeeName: "",
        staffId: "",
        department: "",
        position: "",
        dateOfEmployment: "",
        title: "",
        itemName: "",
        category: "",
        estimatedCost: "",
        currency: "RWF",
        description: "",
        reportingManager: "",
    });

    useEffect(() => {
        if (requestData) {
            setForm(prev => ({
                ...prev,
                requestNumber: requestData.requestNumber || prev.requestNumber,
                employeeName: requestData.user?.name || requestData.employeeName || prev.employeeName,
                staffId: requestData.user?.staffId || requestData.staffId || prev.staffId,
                department: requestData.user?.department?.name || requestData.department || prev.department,
                position: requestData.user?.position || requestData.position || prev.position,
                dateOfEmployment: requestData.user?.dateOfEmployment || requestData.dateOfEmployment || prev.dateOfEmployment,
                title: requestData.title || prev.title,
                itemName: requestData.itemName || prev.itemName,
                category: requestData.category || prev.category,
                estimatedCost: requestData.estimatedCost || prev.estimatedCost,
                currency: requestData.currency || prev.currency,
                description: requestData.description || prev.description,
                reportingManager: requestData.initialApproverId || prev.reportingManager,
            }));
        } else if (user && autoFillData) {
            const sequence = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
            const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
            const docId = `AR-${new Date().getFullYear()}-${currentMonth}-${sequence}`;

            setForm(prev => ({
                ...prev,
                requestNumber: docId,
                employeeName: autoFillData.employeeName || user.name || "",
                staffId: autoFillData.staffId || "",
                department: autoFillData.department || "",
                position: autoFillData.position || "",
                dateOfEmployment: autoFillData.dateOfEmployment || "",
                reportingManager: autoFillData.managerId ? String(autoFillData.managerId) : "",
            }));
        }
    }, [user, autoFillData, requestData]);

    const { data: heads = [] } = trpc.users.listHeads.useQuery(undefined, {
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: 1,
    });

    const uniqueHeads = Array.from(
        new Map(heads.map((h: any) => [h.id, h])).values()
    );

    const createAsset = trpc.requests.createAssetRequest.useMutation();
    const submitRequest = trpc.requests.submitRequest.useMutation();

    const handleSubmit = async (submit: boolean) => {
        if (submit) {
            if (!form.reportingManager) {
                toast.error("Please select a reporting manager (HOD)");
                return;
            }
            if (!form.title.trim()) {
                toast.error("Request title is required");
                return;
            }
            if (!form.itemName.trim()) {
                toast.error("Item name is required");
                return;
            }
            if (!form.estimatedCost || Number(form.estimatedCost) <= 0) {
                toast.error("Estimated cost must be greater than 0");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const created = await createAsset.mutateAsync({
                title: form.title || `Asset Request: ${form.itemName}`,
                itemName: form.itemName,
                description: form.description,
                estimatedCost: Number(form.estimatedCost),
                currency: form.currency,
                category: form.category,
            });

            if (submit) {
                await submitRequest.mutateAsync({
                    id: created.id,
                    initialApproverId: Number(form.reportingManager),
                });
            }

            toast.success(submit ? "Asset request submitted for approval" : "Draft saved");
            onSuccess?.();
        } catch (e: any) {
            toast.error(e.message || "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="w-full bg-white text-black px-4 leave-form-container relative">

            {/* CLOSE/BACK BUTTON */}
            <button
                onClick={() => onBack ? onBack() : (onClose ? onClose() : onSuccess?.())}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                title="Close form"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div>
                {/* ===== HEADER WITH LOGO AND CONTACT INFO ===== */}
                <div className="flex justify-between items-start px-6 py-3 gap-8">
                    <div className="shrink-0">
                        <img
                            src="/logo/centrikaLogo.png"
                            alt="Centrika Logo"
                            className="h-20 w-auto"
                        />
                    </div>
                    <div className="text-sm flex-1 flex justify-end">
                        <div className="flex flex-col gap-3 items-start">
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-blue-600" />
                                <span className="text-blue-600 font-semibold">+250 788 123 099</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-blue-600" />
                                <span className="text-blue-600 font-semibold">info@centrika.rw</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-blue-600" />
                                <span className="text-blue-600 font-semibold">www.centrika.rw</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-blue-600 font-semibold">Room F002, 2nd Floor, CHIC Building,</span>
                                    <span className="text-blue-600 font-semibold">Plot 1007, KN2 Kigali-Rwanda</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TITLE BAR (YELLOW) ===== */}
                <div className="bg-yellow-500 text-white text-center font-bold py-2 text-lg tracking-wide shadow-sm uppercase">
                    Asset / Property Request Form
                </div>

                {/* ===== REQUEST HEADER SECTION ===== */}
                <div className="grid grid-cols-4 gap-3 px-6 py-3 text-sm items-end">
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase tracking-tighter">Department</p>
                        <div className="flex gap-0 items-center">
                            <span className="text-blue-600 font-bold text-xs whitespace-nowrap">CTK - </span>
                            <Input
                                value={form.department}
                                className="w-full h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed border-l-0"
                                disabled
                            />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 mb-1 text-xs uppercase tracking-tighter">Date of Request</p>
                        <Input
                            type="text"
                            value={new Date().toISOString().split('T')[0]}
                            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase tracking-tighter">Request Number</p>
                        <Input
                            value={form.requestNumber}
                            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                            disabled
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-blue-600 text-xs mb-1 uppercase tracking-tighter">Employee Name</p>
                        <Input
                            value={form.employeeName}
                            className="h-7 border-blue-400 text-xs bg-gray-100 cursor-not-allowed"
                            disabled
                        />
                    </div>
                </div>

                {/* ===== REQUEST DETAILS ===== */}
                <div className="border-t border-blue-400">
                    <div className="bg-blue-600 text-white font-bold px-4 py-2 text-sm flex items-center gap-2">
                        <Package size={16} /> ASSET REQUEST DETAILS
                    </div>

                    {/* 1. EMPLOYEE INFORMATION */}
                    <Section title="1. EMPLOYEE INFORMATION">
                        <Row label="1.1 Employee Full Name">
                            <Input
                                value={form.employeeName}
                                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                                disabled
                            />
                        </Row>
                        <Row label="1.2 Employee / Staff ID">
                            <Input
                                value={form.staffId}
                                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                                disabled
                            />
                        </Row>
                        <Row label="1.3 Department">
                            <Input
                                value={form.department}
                                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                                disabled
                            />
                        </Row>
                        <Row label="1.4 Position / Title">
                            <Input
                                value={form.position}
                                className="border-blue-300 h-7 text-xs bg-gray-100 cursor-not-allowed !text-black font-medium"
                                disabled
                            />
                        </Row>
                    </Section>

                    {/* 2. ASSET DETAILS */}
                    <Section title="2. ASSET / PROPERTY DETAILS">
                        <Row label="2.1 Request Title">
                            <Input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g., Replacement Laptop for IT Dept"
                                className="border-blue-300 h-8 text-xs font-medium"
                                disabled={isReadOnly}
                            />
                        </Row>
                        <Row label="2.2 Item Name">
                            <Input
                                value={form.itemName}
                                onChange={e => setForm({ ...form, itemName: e.target.value })}
                                placeholder="e.g., MacBook Pro M3, Office Desk, etc."
                                className="border-blue-300 h-8 text-xs"
                                disabled={isReadOnly}
                            />
                        </Row>
                        <Row label="2.3 Asset Category">
                            <Select 
                                value={form.category} 
                                onValueChange={v => setForm({ ...form, category: v })}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger className="w-full h-8 border-blue-300 text-xs">
                                    <SelectValue placeholder="-- Select Category --" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-blue-200">
                                    <SelectItem value="it_equipment" className="focus:bg-blue-500 focus:text-white">IT Equipment</SelectItem>
                                    <SelectItem value="furniture" className="focus:bg-blue-500 focus:text-white">Furniture</SelectItem>
                                    <SelectItem value="office_supplies" className="focus:bg-blue-500 focus:text-white">Office Supplies</SelectItem>
                                    <SelectItem value="other" className="focus:bg-blue-500 focus:text-white">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </Row>
                        <Row label="2.4 Estimated Cost">
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    value={form.estimatedCost}
                                    onChange={e => setForm({ ...form, estimatedCost: e.target.value })}
                                    placeholder="0.00"
                                    className="border-blue-300 h-8 text-xs font-bold text-blue-800"
                                    disabled={isReadOnly}
                                />
                                <Select 
                                    value={form.currency} 
                                    onValueChange={v => setForm({ ...form, currency: v })}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger className="w-28 h-8 border-blue-300 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-blue-200">
                                        <SelectItem value="RWF" className="focus:bg-blue-500 focus:text-white">RWF</SelectItem>
                                        <SelectItem value="USD" className="focus:bg-blue-500 focus:text-white">USD</SelectItem>
                                        <SelectItem value="EUR" className="focus:bg-blue-500 focus:text-white">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Row>
                        <Row label="2.5 Specific Description / Specs">
                            <Textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Provide detailed specifications, reason for request, and any other relevant information..."
                                className="min-h-24 border-blue-300 text-xs"
                                disabled={isReadOnly}
                            />
                        </Row>
                    </Section>

                    {/* 3. APPROVAL WORKFLOW */}
                    <Section title="3. INITIAL APPROVAL">
                        <Row label="3.1 Reporting Manager / HOD">
                            <Select
                                value={form.reportingManager}
                                onValueChange={v => setForm({ ...form, reportingManager: v })}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger className="w-full h-10 border-blue-300 bg-white text-black font-medium focus:ring-blue-500 mt-1 mb-1">
                                    <SelectValue placeholder="-- Select Department Head --" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-blue-200">
                                    {uniqueHeads.map((head: any) => (
                                        <SelectItem key={head.id} value={String(head.id)} className="focus:bg-blue-500 focus:text-white">
                                            {head.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Row>
                        <div className="bg-blue-50 p-3 text-[10px] text-blue-600 border-b border-blue-400">
                            * Note: After HOD approval, this request will be automatically routed to Finance and escalated to MD/CEO if required by budget limits.
                        </div>
                    </Section>
                </div>

                {/* ===== ACTIONS ===== */}
                {!isReadOnly && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-blue-400 bg-gray-50 gap-4 mb-4">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={isSubmitting}
                                type="button"
                                onClick={() => window.print()}
                                className="border-blue-400 text-blue-600 h-9"
                            >
                                <Printer size={16} className="mr-1" /> Print
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={isSubmitting}
                                type="button"
                                onClick={() => handleSubmit(false)}
                                className="border-blue-400 h-9"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Draft
                            </Button>
                            <Button
                                disabled={isSubmitting}
                                type="button"
                                onClick={() => handleSubmit(true)}
                                className="bg-blue-600 hover:bg-blue-700 h-9 transition-colors font-bold"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Approval
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== FOOTER ===== */}
                <div className="text-center text-[10px] text-gray-500 py-3 border-t border-gray-100 space-y-1">
                    <p>www.centrika.rw</p>
                    <p>© {new Date().getFullYear()} | Centrika Ltd | Delivering Tomorrow's Solutions Today</p>
                </div>
            </div>
        </div>
    );
}

/* ========= Helper Components ========= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-t border-blue-400">
            <div className="bg-blue-500 text-white font-bold px-4 py-1.5 text-xs uppercase tracking-wider">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[240px_1fr] border-b border-blue-400 items-stretch">
            <div className="px-3 py-2 font-semibold border-r border-blue-400 bg-blue-50/50 text-blue-800 text-[11px] flex items-center">
                {label}
            </div>
            <div className="px-3 py-1.5 flex items-center">{children}</div>
        </div>
    );
}
