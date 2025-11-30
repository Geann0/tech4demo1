// Mock data para versão demo - Produtos fictícios
export const mockProducts = [
  {
    id: "demo-1",
    name: "Fone de Ouvido Bluetooth ProSound X1",
    slug: "fone-prosound-x1",
    description: "Fone de ouvido sem fio com cancelamento de ruído ativo, bateria de até 30 horas e som de alta fidelidade. Perfeito para trabalho e entretenimento.",
    price: 299.90,
    image_urls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop"
    ],
    stock: 50,
    is_featured: true,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-2",
    name: "Smartwatch Tech Ultra 2024",
    slug: "smartwatch-tech-ultra",
    description: "Relógio inteligente com monitoramento de saúde completo, GPS integrado, resistente à água e bateria de 7 dias. Compatível com iOS e Android.",
    price: 899.90,
    image_urls: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop"
    ],
    stock: 30,
    is_featured: true,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-3",
    name: "Teclado Mecânico RGB Gamer Pro",
    slug: "teclado-gamer-pro",
    description: "Teclado mecânico com switches blue, iluminação RGB customizável, teclas anti-ghosting e estrutura em alumínio. Ideal para games e digitação.",
    price: 449.90,
    image_urls: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&h=800&fit=crop"
    ],
    stock: 40,
    is_featured: true,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-4",
    name: "Mouse Wireless Precision Max",
    slug: "mouse-precision-max",
    description: "Mouse sem fio de alta precisão com sensor óptico de 16000 DPI, 8 botões programáveis e bateria recarregável de 60 horas.",
    price: 189.90,
    image_urls: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=800&fit=crop"
    ],
    stock: 60,
    is_featured: false,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-5",
    name: "Webcam Full HD StreamPro",
    slug: "webcam-streampro",
    description: "Câmera web Full HD 1080p com microfone embutido, autofoco e correção automática de luz. Perfeita para videoconferências e streaming.",
    price: 349.90,
    image_urls: [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=800&h=800&fit=crop"
    ],
    stock: 25,
    is_featured: false,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-6",
    name: "Carregador Wireless FastCharge 15W",
    slug: "carregador-fastcharge",
    description: "Base de carregamento sem fio com tecnologia de carga rápida de 15W. Compatível com smartphones, fones e smartwatches.",
    price: 129.90,
    image_urls: [
      "https://images.unsplash.com/photo-1591290619762-c588f96c2926?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&h=800&fit=crop"
    ],
    stock: 80,
    is_featured: false,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-7",
    name: "Power Bank 20000mAh UltraFast",
    slug: "powerbank-ultrafast",
    description: "Bateria externa de alta capacidade com carregamento rápido USB-C PD e 3 portas de saída. Ideal para viagens e uso diário.",
    price: 199.90,
    image_urls: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=800&h=800&fit=crop"
    ],
    stock: 45,
    is_featured: false,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  },
  {
    id: "demo-8",
    name: "Suporte para Notebook Ergonômico",
    slug: "suporte-notebook-ergonomico",
    description: "Suporte ajustável em alumínio com 6 níveis de altura, ventilação integrada e design ergonômico para melhor postura.",
    price: 149.90,
    image_urls: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&h=800&fit=crop"
    ],
    stock: 35,
    is_featured: false,
    partner_id: null,
    partner_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: null
  }
];

// Mock orders para demonstração
export const mockOrders = [
  {
    id: "demo-order-1",
    order_code: "T4L-2024-001",
    user_id: "demo-user",
    status: "delivered",
    total_amount: 299.90,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    order_items: [
      {
        product_id: "demo-1",
        quantity: 1,
        unit_price: 299.90,
        products: mockProducts[0]
      }
    ]
  },
  {
    id: "demo-order-2",
    order_code: "T4L-2024-002",
    user_id: "demo-user",
    status: "processing",
    total_amount: 1349.80,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    order_items: [
      {
        product_id: "demo-2",
        quantity: 1,
        unit_price: 899.90,
        products: mockProducts[1]
      },
      {
        product_id: "demo-4",
        quantity: 1,
        unit_price: 449.90,
        products: mockProducts[3]
      }
    ]
  }
];

// Função para simular delay de API
export const simulateAPIDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));
