import { FileText, Car, DollarSign, Package } from "lucide-react";

interface RequestIconProps {
  type: string;
  size?: number;
  className?: string;
}

export const RequestIcon = ({ type, size = 20, className }: RequestIconProps) => {
  switch (type.toLowerCase()) {
    case "leave":
      return <FileText className={`text-blue-400 ${className || ""}`} size={size} />;
    case "car":
      return <Car className={`text-purple-400 ${className || ""}`} size={size} />;
    case "expenditure":
      return <DollarSign className={`text-green-400 ${className || ""}`} size={size} />;
    case "asset":
      return <Package className={`text-orange-400 ${className || ""}`} size={size} />;
    default:
      return <FileText className={`text-slate-400 ${className || ""}`} size={size} />;
  }
};
