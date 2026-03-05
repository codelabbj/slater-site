"use client"

import {Network, Transaction} from "@/lib/types";
import {cn, formatPhoneNumberForDisplay} from "@/lib/utils";
import {ArrowDownToLine, ArrowUpFromLine} from "lucide-react";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Badge} from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {useState} from "react";

interface TransactionCardProps {
    transaction: Transaction
    network: Network|undefined
}

export default function TransactionCard({transaction, network}: TransactionCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const isDeposit = transaction.type_trans === "deposit"

    const getTypeBadge = (type: Transaction["type_trans"]) => {
        return (
            <Badge variant={type === "deposit" ? "default" : "secondary"}>
                {type === "deposit" ? "Dépôt" : "Retrait"}
            </Badge>
        )
    }

    const getStatusBadge = (status: Transaction["status"]) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            pending: { variant: "secondary", label: "En attente" },
            accept: { variant: "default", label: "Accepté" },
            init_payment: { variant: "secondary", label: "En attente" },
            error: { variant: "destructive", label: "Erreur" },
            reject: { variant: "destructive", label: "Rejeté" },
            timeout: { variant: "outline", label: "Expiré" },
        }

        const config = statusConfig[status] || { variant: "outline" as const, label: status }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <>
        <div
            key={transaction.id}
            onClick={() => setIsOpen(true)}
            className={cn(
                "border rounded-lg p-4 hover:shadow-md transition-all duration-200",
                "relative overflow-hidden cursor-pointer"
            )}
        >
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: isDeposit ? "linear-gradient(90deg, rgba(50,251,255,0.35), rgba(23,161,255,0.25))" : "linear-gradient(90deg, rgba(15,34,55,0.35), rgba(50,251,255,0.15))" }} />
            <div className="p-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div
                            className={cn(
                                "p-2  flex-shrink-0",
                                isDeposit ? "bg-primary/15 text-primary" : "bg-secondary/20 text-foreground"
                            )}
                        >
                            {isDeposit ? (
                                <ArrowDownToLine className="h-4 w-4" />
                            ) : (
                                <ArrowUpFromLine className="h-4 w-4" />
                            )}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">#{transaction.reference}</h3>
                                {getTypeBadge(transaction.type_trans)}
                                {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {transaction.app_details?.name || transaction.app} • {formatPhoneNumberForDisplay(transaction.phone_number)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-semibold">
                            {transaction.amount.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                                minimumFractionDigits: 0,
                            })}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                                locale: fr,
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md m-2">
                <DialogHeader className="space-y-4">
                    <DialogTitle>Détails de la transaction</DialogTitle>
                    <DialogDescription>
                        Informations complètes sur cette transaction
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="text-center space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Montant de la transaction</p>
                            <p className="text-4xl font-bold text-primary">
                                {transaction.amount.toLocaleString("fr-FR", {
                                    style: "currency",
                                    currency: "XOF",
                                    minimumFractionDigits: 0,
                                })}
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            {getTypeBadge(transaction.type_trans)}
                            {getStatusBadge(transaction.status)}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {transaction.app_details?.image && (
                            <img
                                src={transaction.app_details.image}
                                alt={transaction.app_details.name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Application</p>
                            <p className="text-base font-semibold truncate">{transaction.app_details?.name || transaction.app}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {network?.image && (
                            <img
                                src={network.image}
                                alt={network.name}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Réseau</p>
                            <p className="text-base font-semibold truncate">{network?.name || `Réseau #${transaction.network}`}</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Référence</p>
                        <p className="text-sm font-semibold font-mono truncate">#{transaction.reference}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Numéro de téléphone</p>
                        <p className="text-base font-semibold">{formatPhoneNumberForDisplay(transaction.phone_number)}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Date et heure</p>
                        <p className="text-sm font-semibold">
                            {format(new Date(transaction.created_at), "EEEE dd MMMM yyyy 'à' HH:mm", {
                                locale: fr,
                            })}
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">ID Application</p>
                        <p className="text-xs font-mono break-all text-muted-foreground">{transaction.user_app_id}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}