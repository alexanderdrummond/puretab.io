import { ChakraProvider, ColorModeScript, CSSReset, ColorModeProvider } from '@chakra-ui/react';
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider>
      <ColorModeScript initialColorMode="dark" />
      <ColorModeProvider options={{ initialColorMode: 'dark', useSystemColorMode: false }}>
        <Component {...pageProps} />
      </ColorModeProvider>
    </ChakraProvider>
  );
}

export default MyApp;
