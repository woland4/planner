import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';

export default defineConfig({

    base: '/planner/',

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },

    plugins: [
        vue(),
        ui({
            router: false,
            ui: {

                select: {
                    slots: {
                        base: 'text-start',
                        item: 'data-highlighted:not-data-disabled:before:bg-elevated'
                    }
                },

                selectMenu: {
                    slots: {
                        base: 'text-start',
                        item: 'data-highlighted:not-data-disabled:before:bg-elevated'
                    }
                }

            }
        })
    ],

    build: {

        emptyOutDir: true,

        assetsInlineLimit: 0,

        rolldownOptions: {
            output: {
                entryFileNames: 'assets/[hash].js',
                chunkFileNames: 'assets/[hash].js',
                assetFileNames(chunkInfo) {
                    if (chunkInfo.originalFileNames.some(f => f.startsWith('src/assets/icons')))
                        return 'assets/icons/[hash][extname]';
                    return 'assets/[hash][extname]';
                }
            }
        }

    },

    server: {

        host: true

    }

})
