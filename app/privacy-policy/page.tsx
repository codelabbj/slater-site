"use client"

import Link from "next/link"
import { ArrowLeft, Shield, FileText, Lock, UserCheck, CreditCard, Scale, HelpCircle, AlertTriangle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
    const sections = [
        { id: "presentation", title: "1. Présentation de Slater", icon: <FileText className="h-5 w-5" /> },
        { id: "acces", title: "2. Conditions d’accès", icon: <UserCheck className="h-5 w-5" /> },
        { id: "responsabilite", title: "3. Responsabilité de l’utilisateur", icon: <Shield className="h-5 w-5" /> },
        { id: "transactions", title: "4. Dépôts et retraits", icon: <CreditCard className="h-5 w-5" /> },
        { id: "equitable", title: "5. Utilisation équitable", icon: <Scale className="h-5 w-5" /> },
        { id: "coupons", title: "6. Coupons et pronostics", icon: <ShieldCheck className="h-5 w-5" /> },
        { id: "frais", title: "7. Frais et commissions", icon: <CreditCard className="h-5 w-5" /> },
        { id: "fraude", title: "8. Lutte contre la fraude", icon: <Lock className="h-5 w-5" /> },
        { id: "limitation", title: "9. Limitation de responsabilité", icon: <AlertTriangle className="h-5 w-5" /> },
        { id: "service", title: "10. Service client", icon: <HelpCircle className="h-5 w-5" /> },
        { id: "conformite", title: "11. Conformité et réglementation", icon: <Scale className="h-5 w-5" /> },
        { id: "modification", title: "12. Modification des conditions", icon: <FileText className="h-5 w-5" /> },
        { id: "acceptation", title: "13. Acceptation", icon: <ShieldCheck className="h-5 w-5" /> },
    ]

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Premium Background Effects */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <header className="relative border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-6 max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.history.back()}
                            className="rounded-full hover:bg-primary/10 transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Politique de Confidentialité
                            </h1>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Slater • Termes et Conditions
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                            Version 2.1
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Navigation Sidebar */}
                    <nav className="lg:col-span-4 hidden lg:block" aria-label="Table des matières">
                        <div className="sticky top-32 space-y-4">
                            <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-xl shadow-primary/5 backdrop-blur-md">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Sommaire
                                </h2>
                                <ul className="space-y-1">
                                    {sections.map((section) => (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group"
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                                                    {section.icon}
                                                </span>
                                                <span className="truncate">{section.title}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-2xl shadow-primary/20">
                                <h3 className="font-bold mb-2">Besoin d'aide ?</h3>
                                <p className="text-sm opacity-90 mb-4">Notre équipe support est disponible 24/7 pour répondre à vos questions sur nos conditions.</p>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all"
                                >
                                    Contacter le support
                                </Link>
                            </div>
                        </div>
                    </nav>

                    {/* Content Area */}
                    <article className="lg:col-span-8 space-y-12">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <div className="mb-12 p-8 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <ShieldCheck className="h-24 w-24" />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-4 mt-0">TERMES ET CONDITIONS D’UTILISATION – SLATER</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                    Dernière mise à jour : <strong className="text-foreground">30 Janvier 2026</strong>
                                </p>
                                <div className="h-1.5 w-24 bg-primary rounded-full" />
                            </div>

                            <section id="presentation" className="scroll-mt-32 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">1. Présentation de Slater</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Slater est une plateforme de services financiers permettant d’effectuer des dépôts et retraits vers des plateformes de paris sportifs partenaires. Slater n’est pas un site de paris sportifs et ne garantit aucun gain.
                                </p>
                            </section>

                            <section id="acces" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                        <UserCheck className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">2. Conditions d’accès</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Vous devez être âgé d’au moins 18 ans, utiliser un numéro valide et fournir des informations exactes. Slater peut refuser ou suspendre l’accès en cas de non-respect.
                                </p>
                            </section>

                            <section id="responsabilite" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">3. Responsabilité de l’utilisateur</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    L’utilisateur est seul responsable de son compte, de ses dépôts, retraits, gains et pertes. Slater n’est pas responsable des décisions des plateformes de paris sportifs.
                                </p>
                            </section>

                            <section id="transactions" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">4. Dépôts et retraits</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Les opérations suivent les procédures indiquées. Vérifiez toujours les informations de paiement. Un code de validation peut être exigé pour les retraits.
                                </p>
                            </section>

                            <section id="equitable" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                        <Scale className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">5. Utilisation équitable</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    L’utilisation uniquement pour des retraits sans dépôts peut entraîner des limitations ou un refus de service.
                                </p>
                            </section>

                            <section id="coupons" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">6. Coupons et pronostics</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Les coupons publiés par les utilisateurs ne sont pas forcément rentables. Téléchargez et analysez chaque coupon avant de jouer. Vous jouez à vos propres risques.
                                </p>
                            </section>

                            <section id="frais" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">7. Frais et commissions</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Certains services peuvent être sans frais. Slater peut modifier ses frais si nécessaire.
                                </p>
                            </section>

                            <section id="fraude" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">8. Lutte contre la fraude</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Slater met en place des mesures pour prévenir la fraude, le blanchiment et l’utilisation abusive.
                                </p>
                            </section>

                            <section id="limitation" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">9. Limitation de responsabilité</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Slater n’est pas responsable des pertes liées aux paris, des pannes partenaires ou des retards opérateurs.
                                </p>
                            </section>

                            <section id="service" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
                                        <HelpCircle className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">10. Service client</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    En cas de souci, contactez rapidement le service client via WhatsApp ou Telegram uniquement.
                                </p>
                            </section>

                            <section id="conformite" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-zinc-500/10 text-zinc-500">
                                        <Scale className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">11. Conformité et réglementation</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Slater applique des règles de conformité, peut demander des documents (KYC), bloquer des transactions suspectes et coopérer avec les autorités si la loi l’exige.
                                </p>
                            </section>

                            <section id="modification" className="scroll-mt-32 transition-all pt-8 border-t border-border/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">12. Modification des conditions</h2>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed leading-[1.8]">
                                    Slater peut modifier les présentes conditions à tout moment.
                                </p>
                            </section>

                            <section id="acceptation" className="scroll-mt-32 transition-all pt-8 border-t border-border/60">
                                <div className="flex items-center gap-3 mb-6 text-primary">
                                    <div className="p-3 rounded-2xl bg-primary/20 text-primary animate-pulse">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold m-0">13. Acceptation</h2>
                                </div>
                                <div className="p-6 rounded-2xl bg-primary/5 border-l-4 border-primary">
                                    <p className="text-foreground text-lg font-bold leading-relaxed m-0 italic">
                                        L’utilisation de Slater vaut acceptation complète des présents Termes et Conditions.
                                    </p>
                                </div>
                            </section>

                            <footer className="pt-16 mt-16 border-t border-border/40 text-center">
                                <p className="text-sm text-muted-foreground italic max-w-lg mx-auto leading-relaxed underline decoration-primary/30 underline-offset-4">
                                    Ceci constitue l'intégralité des termes et conditions régissant votre utilisation du service Slater.
                                </p>
                                <div className="mt-8 flex justify-center">
                                    <Button
                                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 rounded-full hover:bg-primary/5 text-xs uppercase tracking-widest font-bold"
                                    >
                                        Retour en haut
                                    </Button>
                                </div>
                            </footer>
                        </div>
                    </article>
                </div>
            </main>
        </div>
    )
}
