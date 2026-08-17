import { useState } from 'react';
import Modal, { ModalFooter } from './ui/Modal';
import { Field, Input, Textarea, Button, Icon } from './ui';

/**
 * ViewingRequestModal — booking enquiry form, rebuilt on the Phase 0 Modal
 * (backdrop blur, Esc, focus-trap, scroll-lock, safe-area) with Field/Input/
 * Textarea/Button primitives. Form state + onSubmit contract preserved.
 */
export default function ViewingRequestModal({ isOpen, onClose, onSubmit, propertyTitle }) {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', profession: '', numberOfOccupants: 1, preferredDate: '', message: '',
  });
  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <Modal open={isOpen} onClose={onClose} title="Request viewing" description={propertyTitle} size="lg">
      <form id="viewing-form" onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-4">
          <h3 className="text-overline uppercase text-subtle">Personal details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input type="text" required value={formData.name} onChange={set('name')} leftIcon={<Icon name="user" />} />
            </Field>
            <Field label="Phone number" required>
              <Input type="tel" required value={formData.phone} onChange={set('phone')} leftIcon={<Icon name="phone" />} />
            </Field>
          </div>
          <Field label="Email address" required>
            <Input type="email" required value={formData.email} onChange={set('email')} leftIcon={<Icon name="email" />} />
          </Field>
        </section>

        <section className="space-y-4 border-t border-border pt-5">
          <h3 className="text-overline uppercase text-subtle">Tenant profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Profession" required>
              <Input type="text" required value={formData.profession} onChange={set('profession')} placeholder="e.g. Software Engineer" leftIcon={<Icon name="commercial" />} />
            </Field>
            <Field label="Occupants" required>
              <Input type="number" min="1" required value={formData.numberOfOccupants} onChange={set('numberOfOccupants')} leftIcon={<Icon name="users" />} />
            </Field>
          </div>
          <Field label="Preferred move-in date" required>
            <Input type="date" required value={formData.preferredDate} onChange={set('preferredDate')} leftIcon={<Icon name="calendar" />} />
          </Field>
        </section>

        <section className="space-y-2 border-t border-border pt-5">
          <h3 className="text-overline uppercase text-subtle">Additional note (optional)</h3>
          <Textarea rows={3} value={formData.message} onChange={set('message')} placeholder="Hi, I’m interested in viewing this property…" />
        </section>
      </form>

      <ModalFooter>
        <Button type="submit" form="viewing-form" fullWidth size="lg" leftIcon={<Icon name="calendar" />}>Submit request</Button>
      </ModalFooter>
    </Modal>
  );
}
