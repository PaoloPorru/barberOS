import { create } from 'zustand';

export const useBookingStore = create((set) => ({
  step:      1,  // 1=service 2=barber 3=date 4=time 5=confirm
  service:   null,
  barber:    null,
  date:      null,  // 'YYYY-MM-DD'
  slot:      null,  // { start, end, label }
  notes:     '',

  setStep:    (step)    => set({ step }),
  setService: (service) => set({ service, barber: null, date: null, slot: null }),
  setBarber:  (barber)  => set({ barber,  date: null, slot: null }),
  setDate:    (date)    => set({ date,    slot: null }),
  setSlot:    (slot)    => set({ slot }),
  setNotes:   (notes)   => set({ notes }),
  reset:      ()        => set({ step:1, service:null, barber:null, date:null, slot:null, notes:'' }),
  nextStep:   ()        => set((s) => ({ step: s.step + 1 })),
  prevStep:   ()        => set((s) => ({ step: Math.max(1, s.step - 1) })),
}));
