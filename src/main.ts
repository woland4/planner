import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ui from '@nuxt/ui/vue-plugin';
import VueVirtualScroller from 'vue-virtual-scroller';

import Root from '@/layout/Root.vue';

import 'vue-virtual-scroller/index.css';

import '@/style/libs.css';
import '@/style/icons.scss';

import '@/utils/debug.ts';

const app = createApp(Root);

app.use(createPinia());
app.use(ui);
app.use(VueVirtualScroller);

app.mount('#app');
