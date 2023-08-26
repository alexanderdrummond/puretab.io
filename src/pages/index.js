import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import NewTab from './newtab';
import {
  Button,
  Input,
  ChakraProvider,
  Center,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { EmailIcon } from '@chakra-ui/icons';
import supabase from '../utils/supabase';


const inter = Inter({ subsets: ['latin'] });


export default function Home() {
  const [hasAccess, setHasAccess] = useState(null);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('accessKey') : null;

    if (storedKey) {
      validateKey(storedKey);
    } else {
      setLoading(false);
    }
  }, []);

  const validateKey = async (enteredKey) => {
    const { data, error } = await supabase
      .from('access_keys')
      .select('*')
      .eq('key', enteredKey);

    setLoading(false);

    if (data && data.length > 0) {
      localStorage.setItem('accessKey', enteredKey);
      setAlert({
        status: 'success',
        message: 'Access key validated.',
      });
      setHasAccess(true);
    } else {
      setAlert({
        status: 'error',
        message: 'Invalid key.',
      });
      setHasAccess(false);
    }
  };

  const handleKeySubmit = () => {
    setLoading(true);
    validateKey(key);
  };

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner />
      </Center>
    );
  }

  return (
    <ChakraProvider>
      {hasAccess ? (
        <NewTab />
      ) : (
        <Modal isOpen={true} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Enter Access Key</ModalHeader>
            <ModalBody>
              <Flex direction="row" justify="space-between">
                <Input type="text" value={key} onChange={(e) => setKey(e.target.value)} />
                <Button ml={2} colorScheme="blue" onClick={handleKeySubmit}>
                  Submit
                </Button>
              </Flex>
              {alert && (
                <Alert status={alert.status} mt={3}>
                  <AlertIcon />
                  {alert.message}
                </Alert>
              )}
              <Center mt={4}>
                <Button variant="ghost" leftIcon={<EmailIcon />} onClick={() => {}}>
                  Request a key
                </Button>
              </Center>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </ChakraProvider>
  );
}