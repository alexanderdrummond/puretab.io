import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Stack,
  SimpleGrid,
  Select,
  Spinner,
  HStack,
  useColorMode
} from '@chakra-ui/react';
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';

const SortableButton = ({ id, link, setHasDragged, hasDragged, isEditable }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
    transition,
    pointerEvents: isDragging ? 'none' : undefined,
  };

  const conditionalListeners = isEditable ? listeners : {};
  

  return (
    <Button
      ref={setNodeRef}
      size="lg"
      variant="solid"
      leftIcon={link.icon ? <span dangerouslySetInnerHTML={{ __html: link.icon }} /> : null}
      as="a"
      href={link.link}
      target="_blank"
      style={style}
      {...conditionalListeners}
      {...attributes}
      onMouseDown={() => setHasDragged(false)}
      onClick={(e) => {
        if (hasDragged) {
          e.preventDefault();
          setHasDragged(false);
        }
      }}
    >
      {link.label}
    </Button>
  );
};

const NewTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [linkInfo, setLinkInfo] = useState({ label: '', link: '', icon: '', category: '' });
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hasDragged, setHasDragged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));
  const [isEditMode, setIsEditMode] = useState(false); 
  const { colorMode, toggleColorMode } = useColorMode();
 
  const searchInputRef = useRef(null);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      let query = e.target.value;
      let url = '';

      if (query.match(/\.\w+$/)) { 
        url = query.startsWith('http://') || query.startsWith('https://')
          ? query
          : 'https://' + query;
      } else {
        url = `https://www.google.com/search?q=${query}`;
      }

      window.location.href = url; 
    }
  };

  useEffect(() => {
    searchInputRef.current?.focus(); 
  }, []);



  const toggleEditMode = () => {
    setIsEditMode(!isEditMode); 
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id.toString() === active.id);
      const newIndex = links.findIndex((link) => link.id.toString() === over.id);
      console.log('Old index:', oldIndex, 'New index:', newIndex); 
  
      const updatedLinks = arrayMove(links, oldIndex, newIndex);
  
     
      updatedLinks.forEach((link, index) => {
        link.order = index;
      });
  
      setLinks(updatedLinks);
  
      
      console.log('Updated links:', updatedLinks);
  
      
      updatedLinks.forEach(async (link) => {
        await supabase.from('new_tab_links').update({ order: link.order }).match({ id: link.id });
      });
    }
  };


  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addLink = async () => {
    
    const updatedLink = linkInfo.link.startsWith('http://') || linkInfo.link.startsWith('https://')
      ? linkInfo.link
      : 'https://' + linkInfo.link;

    const newLinkInfo = { ...linkInfo, link: updatedLink };

    const { data, error } = await supabase
      .from('new_tab_links')
      .insert([newLinkInfo]);

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      setLinks([...links, data[0]]);
      setCategories([...new Set([...categories, data[0].category])]);
    } else {
      console.error('Unexpected response from Supabase', data);
    }

    setLinkInfo({ label: '', link: '', icon: '', category: '' });
    closeModal();
  };

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase.from('new_tab_links').select('*').order('order', { ascending: true });
  
      if (error) {
        
        console.error(error);
        return;
      }
  
      setLinks(data);
      setCategories(['All', ...new Set(data.map((link) => link.category))]); 
      setIsLoading(false); 
    };
  
    fetchLinks();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
        <Spinner size="xl" />
      </div>
    );
  }


  return (
    <motion.div
      style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HStack style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
      <Button onClick={toggleColorMode}> 
          {colorMode === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
  <Button onClick={openModal}>
    Add Link
  </Button>
  <Button onClick={toggleEditMode}>
    {isEditMode ? "Done" : "Edit"}
  </Button>
</HStack>

<SimpleGrid columns={5} spacing={4} width="50%" style={{ marginBottom: '30px' }}> 
        <Input 
          ref={searchInputRef}
          placeholder="Search or enter website name"
          onKeyDown={handleSearch}
          gridColumn="1 / span 5" 
          marginBottom="15px" 
          autoFocus
        />
        {categories.map((category, index) => (
          <Button key={index} onClick={() => setSelectedCategory(category)}>
            {category}
          </Button>
        ))}
      </SimpleGrid>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((link) => link.id.toString())}>
          <SimpleGrid columns={5} spacing={4}>
            {links
              .sort((a, b) => a.order - b.order) 
              .filter((link) => selectedCategory === 'All' || link.category === selectedCategory)
              .map((link, index) => (
                <SortableButton key={link.id} id={link.id.toString()} link={link} hasDragged={hasDragged} setHasDragged={setHasDragged} isEditable={isEditMode} />
              ))}
          </SimpleGrid>
        </SortableContext>
      </DndContext>
      <Modal isOpen={isModalOpen} onClose={closeModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Link</ModalHeader>
          <ModalBody>
            <Stack spacing={3}>
              <Select
                placeholder="Select Category"
                value={linkInfo.category}
                onChange={(e) => setLinkInfo({ ...linkInfo, category: e.target.value })}
              >
                {categories.filter((category) => category !== 'All').map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Input id="label-input" placeholder="Label" value={linkInfo.label} onChange={(e) => setLinkInfo({ ...linkInfo, label: e.target.value })} />
              <Input id="link-input" placeholder="Link URL" value={linkInfo.link} onChange={(e) => setLinkInfo({ ...linkInfo, link: e.target.value })} />
              <Input id="svg-input" placeholder="Custom SVG Path" value={linkInfo.icon} onChange={(e) => setLinkInfo({ ...linkInfo, icon: e.target.value })} />
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={addLink}>
              Add
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  );
  
};

export default NewTab;
