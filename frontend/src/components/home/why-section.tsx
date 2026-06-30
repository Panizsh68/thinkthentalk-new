'use client';
import { Users, Sparkles, ShieldCheck, Lightbulb, Trophy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function WhySection() {
  const { t } = useLanguage();
  const features = [
    { id: 'speaking', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'friends', icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'safe', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'critical', icon: Lightbulb, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'games', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'noJudgment', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <section className="py-20 md:py-32 border-b border-border/40 px-4">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 md:mb-20 text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.why.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium">{t('home.why.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-card/50">
               <CardHeader>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", f.bg)}>
                    <f.icon className={cn("h-6 w-6", f.color)} />
                  </div>
                  <CardTitle className="text-xl font-bold">{t(`home.why.${f.id}.title`)}</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {t(`home.why.${f.id}.desc`)}
                  </p>
               </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
