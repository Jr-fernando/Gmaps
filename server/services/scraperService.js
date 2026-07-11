import axios from 'axios';
import { dbService } from './dbService.js';

// Generates highly realistic Brazilian companies based on query and city
function generateMockLeads(query, city) {
  const normalizedQuery = query.toLowerCase();
  const normalizedCity = city.toLowerCase();
  
  // Base details by segment
  const segments = {
    padaria: {
      name: 'Padaria',
      category: 'Alimentação / Panificação',
      keywords: ['padaria', 'pão', 'panificadora', 'confeitaria'],
      description: 'Pães artesanais, bolos caseiros, café da manhã completo e doces finos na sua região.'
    },
    odontologia: {
      name: 'Clínica Odontológica',
      category: 'Saúde / Bem-estar',
      keywords: ['odonto', 'dentista', 'clínica odontológica', 'ortodontia'],
      description: 'Tratamentos odontológicos modernos, implantes, clareamento e atendimento infantil personalizado.'
    },
    mecanica: {
      name: 'Oficina Mecânica',
      category: 'Serviços Automotivos',
      keywords: ['mecânica', 'oficina', 'auto', 'carro', 'reparo'],
      description: 'Manutenção preventiva, injeção eletrônica, freios, suspensão e troca de óleo com profissionais qualificados.'
    },
    beleza: {
      name: 'Salão de Beleza',
      category: 'Estética / Cosmética',
      keywords: ['salão', 'beleza', 'cabelo', 'cabeleireiro', 'estética'],
      description: 'Cortes modernos, coloração, manicure, pedicure, tratamento capilar e maquiagem profissional.'
    },
    academia: {
      name: 'Academia Fit',
      category: 'Esportes / Saúde',
      keywords: ['academia', 'fitness', 'crossfit', 'treino'],
      description: 'Treinos personalizados, musculação, aulas de dança, lutas e espaço climatizado de ponta.'
    },
    pizzaria: {
      name: 'Pizzaria',
      category: 'Alimentação / Restaurante',
      keywords: ['pizza', 'pizzaria', 'massa'],
      description: 'Pizzas assadas no forno a lenha, ingredientes selecionados e entrega rápida para sua comodidade.'
    },
    petshop: {
      name: 'Pet Shop',
      category: 'Serviços para Pets',
      keywords: ['pet', 'petshop', 'veterinário', 'banho', 'tosa'],
      description: 'Banho e tosa, rações premium, acessórios e consultas veterinárias com todo amor que seu pet merece.'
    },
    advogado: {
      name: 'Advocacia',
      category: 'Serviços Jurídicos',
      keywords: ['advogado', 'advocacia', 'jurídico', 'escritório'],
      description: 'Assessoria jurídica especializada nas áreas cível, trabalhista, empresarial e tributária.'
    }
  };

  // Find matching segment, default to "Comércio Geral"
  let segmentKey = 'comercio';
  let matched = segments.beleza; // Default fallback
  
  for (const [key, value] of Object.entries(segments)) {
    if (value.keywords.some(kw => normalizedQuery.includes(kw))) {
      segmentKey = key;
      matched = value;
      break;
    }
  }

  if (segmentKey === 'comercio') {
    // Dynamically build a custom segment
    matched = {
      name: query.charAt(0).toUpperCase() + query.slice(1),
      category: 'Comércio / Serviços Locais',
      description: `Excelência no atendimento e os melhores produtos de ${query} na região de ${city}.`
    };
  }

  // List of mock company names modifiers
  const prefixes = ['Gran', 'Portal', 'Espaço', 'Império', 'Master', 'Studio', 'Casa do(a)', 'Central', 'Nova', 'Bella'];
  const suffixes = ['& Co', 'Premium', 'Prime', 'Express', 'Center', 'Forte', 'Brasil', 'Real', '360'];

  // List of neighborhoods for realistic addresses
  const neighborhoods = {
    'são paulo': ['Centro', 'Jardins', 'Pinheiros', 'Itaim Bibi', 'Vila Mariana', 'Tatuapé', 'Moema', 'Santana'],
    'rio de janeiro': ['Copacabana', 'Ipanema', 'Barra da Tijuca', 'Botafogo', 'Centro', 'Tijuca', 'Leblon'],
    'belo horizonte': ['Savassi', 'Lourdes', 'Pampulha', 'Funcionários', 'Buritis', 'Centro', 'Sion'],
    'porto alegre': ['Moinhos de Vento', 'Centro Histórico', 'Menino Deus', 'Petrópolis', 'Bom Fim'],
    'curitiba': ['Batel', 'Centro', 'Água Verde', 'Cabral', 'Santa Felicidade'],
    'salvador': ['Pituba', 'Barra', 'Caminho das Árvores', 'Rio Vermelho', 'Graça']
  };

  const cityKey = Object.keys(neighborhoods).find(k => normalizedCity.includes(k)) || 'são paulo';
  const localNeighborhoods = neighborhoods[cityKey];
  const states = {
    'são paulo': 'SP',
    'rio de janeiro': 'RJ',
    'belo horizonte': 'MG',
    'porto alegre': 'RS',
    'curitiba': 'PR',
    'salvador': 'BA'
  };
  const stateCode = states[cityKey] || 'SP';

  const count = 8; // Number of leads to generate per search
  const leads = [];

  // Generate realistic coordinates for the city
  const baseCoords = {
    'são paulo': { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'belo horizonte': { lat: -19.9191, lng: -43.9378 },
    'porto alegre': { lat: -30.0346, lng: -51.2177 },
    'curitiba': { lat: -25.4290, lng: -49.2671 },
    'salvador': { lat: -12.9714, lng: -38.5014 }
  };
  const center = baseCoords[cityKey] || { lat: -23.5505, lng: -46.6333 };

  for (let i = 0; i < count; i++) {
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Core details
    const cleanName = matched.name.replace('Clínica ', '').replace('Oficina ', '').replace('Salão de ', '');
    let companyName = '';
    if (Math.random() > 0.5) {
      companyName = `${pre} ${cleanName}`;
    } else {
      companyName = `${cleanName} ${suf}`;
    }

    // Capitalize first letters
    companyName = companyName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    const phoneDdd = {
      'são paulo': '11', 'rio de janeiro': '21', 'belo horizonte': '31', 
      'porto alegre': '51', 'curitiba': '41', 'salvador': '71'
    }[cityKey] || '11';

    const numStart = Math.random() > 0.3 ? '9' : '';
    const phoneNum = `${numStart}${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullPhone = `(${phoneDdd}) ${phoneNum}`;
    const cleanPhone = `${phoneDdd}${phoneNum.replace('-', '')}`;

    const hasWebsite = Math.random() > 0.45; // 45% have websites
    let website = '';
    if (hasWebsite) {
      const slug = companyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
      website = `https://www.${slug}.com.br`;
    }

    const hasInstagram = Math.random() > 0.3; // 70% have instagram
    const instagram = hasInstagram ? `@${slugName}` : '';
    const instagramLink = hasInstagram ? `https://instagram.com/${slugName}` : '';

    const hasFacebook = Math.random() > 0.4; // 60% have facebook
    const facebook = hasFacebook ? `https://facebook.com/${slugName}` : '';

    // Make some ratings low, some reviews very low to match the search filters
    const rating = Math.random() > 0.25 
      ? parseFloat((4.0 + Math.random() * 1.0).toFixed(1)) 
      : parseFloat((2.5 + Math.random() * 1.4).toFixed(1));
      
    const reviewsCount = Math.random() > 0.3
      ? Math.floor(25 + Math.random() * 300)
      : Math.floor(1 + Math.random() * 20);

    const followers = hasInstagram ? Math.floor(100 + Math.random() * 8500) : 0;

    const neighborhood = localNeighborhoods[Math.floor(Math.random() * localNeighborhoods.length)];
    const street = ['Rua Augusta', 'Av. Paulista', 'Rua das Flores', 'Av. Getúlio Vargas', 'Av. Brasil', 'Rua Amazonas'][Math.floor(Math.random() * 6)];
    const addressNumber = Math.floor(10 + Math.random() * 2500);
    
    const slugName = companyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

    // Add coordinates offset
    const lat = parseFloat((center.lat + (Math.random() - 0.5) * 0.05).toFixed(6));
    const lng = parseFloat((center.lng + (Math.random() - 0.5) * 0.05).toFixed(6));
    
    // Add schedule
    const schedule = 'Segunda a Sexta: 08:00 - 18:00, Sábado: 09:00 - 13:00';

    const mockReviewsList = [
      { author: "Carlos Silva", rating: 5, text: "Excelente atendimento, profissionais super atenciosos e qualidade impecável!", date: "Há 2 semanas" },
      { author: "Mariana Costa", rating: 4, text: "Muito bom o serviço, recomendo bastante na região.", date: "Há 1 mês" },
      { author: "João Souza", rating: 5, text: "O melhor custo-benefício que encontrei na cidade. Recomendo de olhos fechados.", date: "Há 3 meses" }
    ];
    const mockGalleryList = [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?w=500&auto=format&fit=crop&q=60"
    ];

    leads.push({
      name: companyName,
      segment: matched.name,
      phone: fullPhone,
      whatsapp: `55${cleanPhone}`,
      email: `contato@${slugName}.com.br`,
      website: website,
      instagram: instagram,
      facebook: facebook,
      city: city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      state: stateCode,
      address: `${street}, ${addressNumber} - ${neighborhood}`,
      rating: rating,
      reviews_count: reviewsCount,
      followers: followers,
      description: matched.description,
      category: matched.category,
      gmaps_link: `https://google.com/maps/place/${encodeURIComponent(companyName + ' ' + city)}`,
      instagram_link: instagramLink,
      status: 'Novo Lead',
      has_website: hasWebsite ? 1 : 0,
      latitude: lat,
      longitude: lng,
      schedule: schedule,
      reviews: mockReviewsList,
      gallery: mockGalleryList
    });
  }

  return leads;
}

// Call Google Places API for real search if Key is present
async function searchRealPlaces(query, city, apiKey) {
  const searchStr = `${query} em ${city}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchStr)}&key=${apiKey}&language=pt-BR`;
  
  try {
    const response = await axios.get(url);
    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }

    const results = response.data.results;
    const leads = [];

    // For each result, get details
    for (const place of results.slice(0, 10)) { // Limit to 10 for performance
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,formatted_address,url,editorial_summary,types,geometry,opening_hours,reviews,photos&key=${apiKey}&language=pt-BR`;
      
      let details = {};
      try {
        const detailsRes = await axios.get(detailsUrl);
        if (detailsRes.data.status === 'OK') {
          details = detailsRes.data.result;
        }
      } catch (err) {
        console.error('Error fetching place details:', err.message);
      }

      const name = place.name || details.name;
      const address = place.formatted_address || details.formatted_address || '';
      
      // Parse state/city from address if possible
      let state = 'SP';
      let cleanCity = city;
      
      const addrParts = address.split(',');
      if (addrParts.length > 1) {
        const statePart = addrParts[addrParts.length - 2] || '';
        const match = statePart.trim().match(/([A-Z]{2})/);
        if (match) state = match[1];
      }

      const phone = details.formatted_phone_number || '';
      const whatsapp = phone ? '55' + phone.replace(/[^0-9]/g, '') : '';
      const website = details.website || '';
      
      const slugName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

      // Parse latitude, longitude, and opening hours
      const lat = place.geometry?.location?.lat || details.geometry?.location?.lat || 0;
      const lng = place.geometry?.location?.lng || details.geometry?.location?.lng || 0;
      const weekdayText = details.opening_hours?.weekday_text;
      const schedule = weekdayText ? weekdayText.join(', ') : 'Segunda a Sexta: 08:00 - 18:00';

      // Parse reviews
      const reviews = details.reviews ? details.reviews.map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        date: r.relative_time_description
      })) : [];

      // Parse gallery (photos)
      const gallery = details.photos ? details.photos.slice(0, 3).map(p => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photo_reference=${p.photo_reference}&key=${apiKey}`
      ) : [];

      leads.push({
        name: name,
        segment: query,
        phone: phone,
        whatsapp: whatsapp,
        email: `contato@${slugName}.com.br`, // Mocked default email if website is unknown
        website: website,
        instagram: `@${slugName}`,
        facebook: '',
        city: cleanCity,
        state: state,
        address: address,
        rating: place.rating || details.rating || 0,
        reviews_count: place.user_ratings_total || details.user_ratings_total || 0,
        followers: 0, // Cannot fetch followers directly from Places API
        description: details.editorial_summary?.overview || `${query} local em ${cleanCity}`,
        category: details.types ? details.types[0] : 'Empresa',
        gmaps_link: details.url || `https://google.com/maps/place/?q=place_id:${place.place_id}`,
        instagram_link: '',
        status: 'Novo Lead',
        has_website: website ? 1 : 0,
        latitude: lat,
        longitude: lng,
        schedule: schedule,
        reviews: reviews,
        gallery: gallery
      });
    }
    
    return leads;
  } catch (err) {
    console.error('Falha ao usar Google Places API, caindo de volta para a simulação:', err.message);
    return generateMockLeads(query, city);
  }
}

export const searchCompanies = async (query, city) => {
  // Check if Google Places API key is set in database
  let apiKey = '';
  try {
    apiKey = await dbService.settings.getSettingByKey('google_places_api_key');
  } catch (err) {
    console.error('Error fetching settings:', err.message);
  }

  if (apiKey && apiKey.trim() !== '') {
    console.log(`Usando Google Places API real com a chave configurada para: ${query} em ${city}...`);
    return await searchRealPlaces(query, city, apiKey);
  } else {
    console.log(`Chave Google Places API não encontrada. Usando gerador de simulação avançada para: ${query} em ${city}...`);
    // Wait for 1.5 seconds to simulate API lag
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockLeads(query, city);
  }
};
