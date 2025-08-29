import localFont from 'next/font/local';

export const roboto = localFont({
  src: [
    {
      path: '../fonts/Roboto/Roboto-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Roboto/Roboto-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Roboto/Roboto-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Roboto/Roboto-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Roboto/Roboto-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-roboto',
  display: 'swap',
});
