import { useMediaQuery } from '@vueuse/core';

export const useResponsiveness = () => ({

    isDesktop: useMediaQuery('(min-width: 768px)'),

    isMobile: useMediaQuery('(max-width: 767px)')

});
