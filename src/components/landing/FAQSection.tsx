import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'How does GPS check-in work?', a: "Workers check in from their phone when they arrive at a shift location. Align uses GPS proximity verification to confirm they\u2019re within the configured radius, giving managers real-time attendance visibility." },
  { q: 'Can workers swap shifts with each other?', a: 'Yes! Workers can request shift swaps directly in the app. Depending on your team settings, swaps can be auto-approved or require manager approval before they take effect.' },
  { q: 'Is Align available as a mobile app?', a: 'Align is a Progressive Web App (PWA), which means it works in any browser and can be installed on any device \u2014 no app store download required. It even works offline.' },
  { q: 'How do shift templates work?', a: 'Managers can create reusable shift templates with pre-set times, locations, and positions. Apply a template to quickly generate shifts for the week \u2014 cutting scheduling time by up to 80%.' },
  { q: 'What happens if a worker calls off?', a: 'Workers can submit call-off requests with a reason. Managers are notified instantly, and the shift is automatically marked as vacant so it can be reassigned or posted as an open shift.' },
  { q: 'Can I try Align before committing?', a: 'Absolutely. The Starter plan is free forever for teams of up to 5 workers. No credit card required \u2014 just sign up and start scheduling.' },
];

export const FAQSection = () => (
  <section id="faq" className="py-20 bg-card/30">
    <div className="max-w-3xl mx-auto px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Frequently asked questions</h2>
        <p className="text-muted-foreground text-lg">Everything you need to know about Align.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-border/50 bg-card px-6 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="text-left text-sm font-medium py-5 hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
