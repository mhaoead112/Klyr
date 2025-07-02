import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});


//  okay it works now but 2 more issues arise, first off i want the balance to be actually editable and if i withdraw or send it should acc remove it, and when you top up your balance it works but logs you out

// the next prompt