import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ShopProduct } from '../../types';
import { ShoppingBag, X, Plus, Minus, Send, Heart, Search, Filter, Instagram, MessageCircle, Mail, Leaf, Award, TrendingUp, Eye } from 'lucide-react';

// Shop Owner Profile Interface
interface ShopProfile {
    name: string;
    bio: string;
    avatar_url?: string;
    instagram?: string;
    whatsapp?: string;
    email?: string;
    specialty?: string;
}

export default function ShopPublic() {
    const { slug } = useParams();
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ product: ShopProduct; qty: number }[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');

    // NEW: Advanced Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [showFilters, setShowFilters] = useState(false);

    // NEW: Wishlist (localStorage)
    const [wishlist, setWishlist] = useState<number[]>([]);

    // NEW: Lightbox
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // NEW: Shop Profile
    const [shopProfile] = useState<ShopProfile>({
        name: 'CarniLab Vivero',
        bio: 'Cultivadores apasionados de plantas carnívoras. Cada planta es cuidada con dedicación para garantizar su salud y belleza.',
        specialty: 'Especialistas en Nepenthes y Sarracenia'
    });

    // NEW: Social Proof
    const [viewCounts, setViewCounts] = useState<Record<number, number>>({});

    // Order Form
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Animation State
    const [flyingItem, setFlyingItem] = useState<{ x: number, y: number, img: string } | null>(null);

    useEffect(() => {
        if (slug) {
            fetchShopData();
            loadWishlist();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const fetchShopData = async () => {
        setLoading(true);

        // 1. Fetch Products
        const { data: prodData } = await supabase
            .from('shop_products')
            .select('*')
            .eq('owner_key', slug)
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (prodData) {
            setProducts(prodData);

            // Generate random view counts for social proof (in production, track real views)
            const counts: Record<number, number> = {};
            prodData.forEach(p => {
                counts[p.id] = Math.floor(Math.random() * 50) + 10;
            });
            setViewCounts(counts);
        }

        // 2. Fetch Shop Profile (if exists in future)
        // For now using default profile

        setLoading(false);
    };

    // Wishlist Functions
    const loadWishlist = () => {
        const saved = localStorage.getItem(`wishlist_${slug}`);
        if (saved) setWishlist(JSON.parse(saved));
    };

    const toggleWishlist = (productId: number) => {
        setWishlist(prev => {
            const newWishlist = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            localStorage.setItem(`wishlist_${slug}`, JSON.stringify(newWishlist));
            return newWishlist;
        });
    };

    // Advanced Filtering & Sorting
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products;

        // Category Filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        // Search Filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Price Range Filter
        filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        // Sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'popular':
                    return (viewCounts[b.id] || 0) - (viewCounts[a.id] || 0);
                case 'newest':
                default:
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
        });

        return sorted;
    }, [products, categoryFilter, searchTerm, priceRange, sortBy, viewCounts]);

    // Related Products (same category, exclude current)
    const getRelatedProducts = (product: ShopProduct) => {
        return products
            .filter(p => p.category === product.category && p.id !== product.id && p.active)
            .slice(0, 3);
    };

    const addToCart = (p: ShopProduct, e?: React.MouseEvent) => {
        if (e) {
            const rect = e.currentTarget.getBoundingClientRect();
            setFlyingItem({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                img: p.image_url
            });
            setTimeout(() => setFlyingItem(null), 800);
        }

        setCart(prev => {
            const existing = prev.find(item => item.product.id === p.id);
            if (existing) {
                return prev.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product: p, qty: 1 }];
        });
        setTimeout(() => setCartOpen(true), 800);
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

    const handleCheckout = async () => {
        if (!customerName || !customerPhone) return alert("Por favor completa tu nombre y WhatsApp.");
        if (!slug) return;

        const orderPayload = {
            owner_key: slug,
            customer_name: customerName,
            customer_contact: customerPhone,
            items: cart.map(i => ({ id: i.product.id, title: i.product.title, price: i.product.price, qty: i.qty })),
            total: cartTotal,
            status: 'pending'
        };

        const { error } = await supabase.from('shop_orders').insert(orderPayload);

        if (error) {
            alert("Hubo un error al crear el pedido. Intenta de nuevo.");
            return;
        }

        const message = `Hola! Soy ${customerName}. Quisiera pedir:\n` +
            cart.map(i => `- ${i.product.title} x${i.qty} ($${i.product.price * i.qty})`).join('\n') +
            `\n\n*Total: $${cartTotal}*`;

        const whatsappUrl = `https://wa.me/${shopProfile.whatsapp || ''}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        setCart([]);
        setCartOpen(false);
    };

    return (
        <div className="min-h-screen relative font-serif text-[#1A4D2E] overflow-x-hidden">
            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0 bg-cover bg-center grayscale opacity-80" style={{ backgroundImage: `url('/assets/images/shop_bg.png')`, backgroundBlendMode: 'multiply' }} />
            <div className="fixed inset-0 z-0 bg-[#F5F1EB]/90 backdrop-blur-[2px]" />

            {/* HEADER */}
            <header className="sticky top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg">
                <div className="flex items-center gap-4">
                    {shopProfile.avatar_url && (
                        <img src={shopProfile.avatar_url} className="w-10 h-10 rounded-full border-2 border-[#1A4D2E] object-cover" alt="Owner" />
                    )}
                    <div>
                        <div className="font-serif text-2xl font-bold tracking-tight text-[#1A4D2E]">
                            {shopProfile.name}
                        </div>
                        <div className="text-[10px] text-[#1A4D2E]/60 font-medium">{shopProfile.specialty}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Wishlist Badge */}
                    <button
                        onClick={() => alert('Filtro de favoritos próximamente')}
                        className="relative p-2 bg-white/40 rounded-full hover:bg-white/60 transition-colors"
                    >
                        <Heart size={22} color="#1A4D2E" fill={wishlist.length > 0 ? "#1A4D2E" : "none"} />
                        {wishlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {wishlist.length}
                            </span>
                        )}
                    </button>

                    {/* Cart Badge */}
                    <button id="cart-button" onClick={() => setCartOpen(true)} className="relative p-2 bg-white/40 rounded-full hover:bg-white/60 transition-colors">
                        <ShoppingBag size={22} color="#1A4D2E" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="relative z-10 pt-8 px-4 md:px-8 pb-32 max-w-7xl mx-auto">

                {/* SHOP PROFILE CARD */}
                <div className="mb-12 bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A4D2E] to-[#2D6F3E] flex items-center justify-center text-4xl text-white shadow-lg">
                            🌿
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-[#1A4D2E] mb-2">{shopProfile.name}</h1>
                            <p className="text-[#1A4D2E]/70 text-base leading-relaxed mb-4">{shopProfile.bio}</p>

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {shopProfile.instagram && (
                                    <a href={`https://instagram.com/${shopProfile.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/60 hover:bg-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                                        <Instagram size={16} /> Instagram
                                    </a>
                                )}
                                {shopProfile.whatsapp && (
                                    <a href={`https://wa.me/${shopProfile.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/60 hover:bg-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                )}
                                {shopProfile.email && (
                                    <a href={`mailto:${shopProfile.email}`} className="flex items-center gap-2 bg-white/60 hover:bg-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                                        <Mail size={16} /> Email
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 items-center bg-white/60 rounded-2xl p-4 min-w-[160px]">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#1A4D2E]">{products.filter(p => p.active).length}</div>
                                <div className="text-xs text-[#1A4D2E]/60 font-medium">Productos</div>
                            </div>
                            <div className="w-full h-px bg-[#1A4D2E]/10" />
                            <div className="text-center">
                                <div className="text-3xl">🏆</div>
                                <div className="text-xs text-[#1A4D2E]/60 font-medium">Verificado</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HERO BANNER */}
                <div className="mb-12">
                    {products.find(p => p.is_featured) ? (
                        (() => {
                            const featured = products.find(p => p.is_featured)!;
                            const relatedToFeatured = getRelatedProducts(featured);

                            return (
                                <div className="relative w-full h-[50vh] min-h-[400px] rounded-3xl overflow-hidden shadow-2xl flex items-center group">
                                    <img
                                        src={featured.image_url}
                                        onClick={() => setLightboxImage(featured.image_url)}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105 cursor-zoom-in"
                                        alt="Featured"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                                    <div className="relative z-10 px-8 md:px-16 max-w-2xl text-white">
                                        <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
                                            <Award size={14} /> Producto Destacado
                                        </div>
                                        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                                            {featured.title}
                                        </h1>
                                        <p className="text-lg text-white/90 mb-8 line-clamp-3">
                                            {featured.description || 'Una pieza única para tu colección.'}
                                        </p>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                                <Eye size={14} /> {viewCounts[featured.id] || 0} vistas
                                            </div>
                                            {featured.stock === 1 && (
                                                <div className="flex items-center gap-2 text-sm bg-orange-500 px-3 py-1 rounded-full animate-pulse">
                                                    ⚡ ¡Última unidad!
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={(e) => addToCart(featured, e)}
                                                className="bg-white/90 hover:bg-white text-[#1A4D2E] px-8 py-3 rounded-full font-bold transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
                                            >
                                                <ShoppingBag size={20} /> Comprar Ahora - ${featured.price}
                                            </button>
                                            <button
                                                onClick={() => toggleWishlist(featured.id)}
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2"
                                            >
                                                <Heart size={20} fill={wishlist.includes(featured.id) ? "currentColor" : "none"} />
                                            </button>
                                        </div>

                                        {relatedToFeatured.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-white/20">
                                                <div className="text-sm font-bold mb-3 opacity-80">También te puede interesar:</div>
                                                <div className="flex gap-3">
                                                    {relatedToFeatured.map(rp => (
                                                        <div key={rp.id} className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:scale-110 transition-transform border-2 border-white/30" onClick={() => addToCart(rp)}>
                                                            <img src={rp.image_url} className="w-full h-full object-cover" alt={rp.title} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="relative w-full h-[40vh] min-h-[300px] rounded-3xl flex items-center justify-center overflow-hidden shadow-xl border border-white/20">
                            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/30 p-10 md:p-16 rounded-2xl text-center max-w-2xl mx-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                                <div className="text-5xl mb-4">🌿</div>
                                <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1A4D2E] drop-shadow-sm mb-2">
                                    Naturaleza Viva
                                </h1>
                                <p className="text-[#1A4D2E]/80 text-lg font-light tracking-wide italic">
                                    Colección {shopProfile.name}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* SEARCH & FILTERS BAR */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A4D2E]/40" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar plantas, insumos..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-[#1A4D2E] placeholder:text-[#1A4D2E]/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A4D2E]/60 hover:text-[#1A4D2E]">
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Sort & Filter Toggle */}
                        <div className="flex gap-3">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="px-4 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-[#1A4D2E] text-sm font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                            >
                                <option value="newest">Más Nuevo</option>
                                <option value="price-low">Menor Precio</option>
                                <option value="price-high">Mayor Precio</option>
                                <option value="popular">Más Popular</option>
                            </select>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-3 backdrop-blur-md border rounded-2xl flex items-center gap-2 transition-all ${showFilters ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' : 'bg-white/60 text-[#1A4D2E] border-white/40'}`}
                            >
                                <Filter size={18} /> Filtros
                            </button>
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-[#1A4D2E] mb-2">Rango de Precio</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={priceRange[0]}
                                            onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                                            className="w-24 px-3 py-2 bg-white rounded-lg border border-[#1A4D2E]/20 text-sm focus:outline-none focus:border-[#D4AF37]"
                                            placeholder="Min"
                                        />
                                        <span className="text-[#1A4D2E]/60">-</span>
                                        <input
                                            type="number"
                                            value={priceRange[1]}
                                            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                                            className="w-24 px-3 py-2 bg-white rounded-lg border border-[#1A4D2E]/20 text-sm focus:outline-none focus:border-[#D4AF37]"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#1A4D2E] mb-2">Solo Favoritos</label>
                                    <button
                                        onClick={() => alert('Función próximamente')}
                                        className="px-4 py-2 bg-white rounded-lg border border-[#1A4D2E]/20 text-sm hover:bg-rose-50 transition-colors flex items-center gap-2"
                                    >
                                        <Heart size={16} fill={wishlist.length > 0 ? "#1A4D2E" : "none"} />
                                        {wishlist.length} favoritos
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories - Enhanced */}
                <div className="flex gap-3 overflow-x-auto pb-6 justify-center no-scrollbar mb-8">
                    {[
                        { id: 'all', label: 'Todo', icon: <Leaf size={16} /> },
                        { id: 'plant', label: 'Plantas', icon: '🌿' },
                        { id: 'supply', label: 'Insumos', icon: '🧪' },
                        { id: 'merch', label: 'Merch', icon: '🎁' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-6 py-3 rounded-2xl backdrop-blur-md text-sm font-bold transition-all uppercase tracking-wider border flex items-center gap-2 whitespace-nowrap
                                ${categoryFilter === cat.id
                                    ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-lg scale-105'
                                    : 'bg-white/40 text-[#1A4D2E] border-white/40 hover:bg-white/60'}`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Results Counter */}
                {searchTerm && (
                    <div className="mb-4 text-sm text-[#1A4D2E]/60 font-medium">
                        {filteredAndSortedProducts.length} resultado{filteredAndSortedProducts.length !== 1 ? 's' : ''} para "<span className="text-[#1A4D2E] font-bold">{searchTerm}</span>"
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 animate-pulse text-[#1A4D2E]">
                        <div className="text-5xl mb-4">🌿</div>
                        Cargando vivero...
                    </div>
                ) : filteredAndSortedProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white/30 backdrop-blur-xl rounded-3xl">
                        <div className="text-6xl mb-4 opacity-20">🔍</div>
                        <p className="text-lg text-[#1A4D2E]/60 font-medium">No encontramos productos que coincidan</p>
                        <button onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }} className="mt-4 px-6 py-2 bg-[#1A4D2E] text-white rounded-full hover:bg-[#143D24] transition-colors">
                            Ver todos los productos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedProducts.map((product, i) => (
                            <div
                                key={product.id}
                                className="group relative bg-white/30 backdrop-blur-xl rounded-[20px] border border-white/40 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                {/* Wishlist Heart */}
                                <button
                                    onClick={() => toggleWishlist(product.id)}
                                    className="absolute top-3 right-3 z-20 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                >
                                    <Heart size={20} fill={wishlist.includes(product.id) ? "#FF6B6B" : "none"} stroke={wishlist.includes(product.id) ? "#FF6B6B" : "#1A4D2E"} />
                                </button>

                                {/* Image */}
                                <div className="h-64 overflow-hidden relative bg-white/10 group-hover:scale-[1.02] transition-transform duration-700 cursor-zoom-in" onClick={() => setLightboxImage(product.image_url)}>
                                    <img
                                        src={product.image_url}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A4D2E]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* ENHANCED BADGES */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        {product.stock === 0 && (
                                            <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                Agotado
                                            </span>
                                        )}
                                        {product.stock === 1 && (
                                            <span className="bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                                                ⚡ Última
                                            </span>
                                        )}
                                        {product.created_at && (new Date().getTime() - new Date(product.created_at).getTime() < 172800000) && (
                                            <span className="bg-teal-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                ✨ Nuevo
                                            </span>
                                        )}
                                        {viewCounts[product.id] > 30 && (
                                            <span className="bg-purple-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                <TrendingUp size={10} /> Popular
                                            </span>
                                        )}
                                    </div>

                                    {/* View Count Badge */}
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                        <Eye size={10} /> {viewCounts[product.id] || 0}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 relative">
                                    <div className="flex justify-between items-start mb-2 group-hover:translate-x-1 transition-transform">
                                        <h3 className="font-serif text-xl font-bold leading-tight flex-1 pr-2">
                                            {searchTerm && product.title.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                                <span dangerouslySetInnerHTML={{
                                                    __html: product.title.replace(
                                                        new RegExp(searchTerm, 'gi'),
                                                        match => `<mark class="bg-yellow-200/60 text-[#1A4D2E]">${match}</mark>`
                                                    )
                                                }} />
                                            ) : product.title}
                                        </h3>
                                        <span className="font-sans font-bold text-[#D4AF37] text-lg whitespace-nowrap">${product.price}</span>
                                    </div>
                                    <p className="text-sm text-[#1A4D2E]/80 mb-4 line-clamp-2">{product.description || 'Planta de colección cultivada con dedicación.'}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => product.stock > 0 && addToCart(product, e)}
                                            disabled={product.stock === 0}
                                            className={`flex-1 py-3 text-white rounded-xl font-medium tracking-wide transition-all duration-300 flex items-center justify-center gap-2
                                                ${product.stock > 0
                                                    ? 'bg-[#1A4D2E] hover:bg-[#143D24] hover:shadow-lg hover:scale-[1.02] active:scale-95'
                                                    : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
                                        >
                                            <Plus size={16} /> {product.stock > 0 ? 'Agregar' : 'Sin Stock'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 bg-[#1A4D2E] text-white py-12 px-6 mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* About */}
                        <div>
                            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                                <Leaf size={20} /> {shopProfile.name}
                            </h3>
                            <p className="text-white/70 text-sm leading-relaxed mb-4">
                                {shopProfile.bio}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-white/60">
                                <Award size={14} /> Vendedor Verificado
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Contacto</h3>
                            <div className="space-y-3 text-sm">
                                {shopProfile.whatsapp && (
                                    <a href={`https://wa.me/${shopProfile.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                )}
                                {shopProfile.instagram && (
                                    <a href={`https://instagram.com/${shopProfile.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                                        <Instagram size={16} /> @{shopProfile.instagram}
                                    </a>
                                )}
                                {shopProfile.email && (
                                    <a href={`mailto:${shopProfile.email}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                                        <Mail size={16} /> {shopProfile.email}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Información</h3>
                            <div className="space-y-2 text-sm text-white/70">
                                <p>✓ Envíos a todo el país</p>
                                <p>✓ Plantas garantizadas</p>
                                <p>✓ Atención personalizada</p>
                                <p>✓ Asesoramiento incluido</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6 text-center text-sm text-white/50">
                        <p>© 2024 {shopProfile.name} - Powered by <span className="text-teal-400 font-bold">CarniLab</span></p>
                    </div>
                </div>
            </footer>

            {/* LIGHTBOX MODAL */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Ampliado"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* FLYING ITEM ANIMATION */}
            {flyingItem && (
                <div
                    className="fixed z-[100] pointer-events-none transition-all duration-700 ease-in-out"
                    style={{
                        left: flyingItem.x,
                        top: flyingItem.y,
                        transform: 'translate(-50%, -50%) scale(1)',
                        animation: 'flyToCart 0.8s forwards'
                    }}
                >
                    <img src={flyingItem.img} className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg" alt="" />
                </div>
            )}

            <style>{`
                @keyframes flyToCart {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        left: calc(100% - 40px);
                        top: 40px;
                        transform: translate(-50%, -50%) scale(0.2);
                        opacity: 0;
                    }
                }
            `}</style>

            {/* CART DRAWER - ENHANCED */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#F9F7F2]/95 backdrop-blur-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        <div className="p-6 border-b border-[#1A4D2E]/10 flex justify-between items-center">
                            <h2 className="font-serif text-2xl font-bold text-[#1A4D2E] flex items-center gap-2">
                                <ShoppingBag size={24} /> Tu Pedido
                            </h2>
                            <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center text-[#1A4D2E]/50 py-10">
                                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="italic">Tu carrito está vacío.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product.id} className="flex gap-4 items-center bg-white/50 p-3 rounded-xl hover:bg-white/70 transition-colors">
                                        <img src={item.product.image_url} className="w-16 h-16 rounded-lg object-cover bg-white shadow-sm" alt="" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#1A4D2E]">{item.product.title}</h4>
                                            <div className="text-sm text-[#D4AF37] font-bold">${item.product.price} × {item.qty}</div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm">
                                            <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:text-[#D4AF37] transition-colors">
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:text-[#D4AF37] transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-white border-t border-[#1A4D2E]/10">
                            <div className="flex justify-between mb-6 text-xl font-bold text-[#1A4D2E]">
                                <span>Total</span>
                                <span className="text-[#D4AF37]">${cartTotal}</span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <input
                                    placeholder="Tu Nombre"
                                    className="w-full bg-[#F5F1EB] p-3 rounded-lg border border-[#E8E2D7] focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                />
                                <input
                                    placeholder="WhatsApp (para contactarte)"
                                    className="w-full bg-[#F5F1EB] p-3 rounded-lg border border-[#E8E2D7] focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full py-4 bg-[#1A4D2E] text-white rounded-xl font-bold tracking-wide hover:bg-[#143D24] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                            >
                                <Send size={18} /> Enviar Pedido por WhatsApp
                            </button>

                            <p className="text-center text-xs text-[#1A4D2E]/50 mt-3">
                                Serás redirigido a WhatsApp para confirmar tu pedido
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
