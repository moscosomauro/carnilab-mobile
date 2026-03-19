import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { ShopProduct, ShopOrder } from '../../types';
import { Package, ClipboardList, Plus, Edit2, Trash2, ExternalLink, Star, Copy, QrCode, TrendingUp, DollarSign, AlertCircle, Search, Check, X, Eye, EyeOff, Settings, User, Instagram, MessageCircle, Mail, Download } from 'lucide-react';

// Shop Profile Interface (to match ShopPublic)
interface ShopProfile {
    name: string;
    bio: string;
    avatar_url?: string;
    instagram?: string;
    whatsapp?: string;
    email?: string;
    specialty?: string;
}

export default function ShopManager() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'settings'>('catalog');
    const [loading, setLoading] = useState(false);

    // Data State
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [orders, setOrders] = useState<ShopOrder[]>([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    // Form State - Products
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formStock, setFormStock] = useState('1');
    const [uploading, setUploading] = useState(false);
    const [formImage, setFormImage] = useState('');
    const [formCategory, setFormCategory] = useState<'plant' | 'supply' | 'merch'>('plant');

    // Form State - Profile
    const [shopProfile, setShopProfile] = useState<ShopProfile>({
        name: 'Mi Tienda',
        bio: 'Descripción de tu tienda',
        specialty: 'Tu especialidad'
    });

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'plant' | 'supply' | 'merch'>('all');
    const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'cancelled'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'stock'>('newest');

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Derived Shop URL
    const shopUrl = window.location.origin + '/#/shop/' + user?.key;

    useEffect(() => {
        if (user?.key) {
            if (activeTab === 'catalog') fetchProducts();
            else if (activeTab === 'orders') fetchOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTab]);

    const fetchProducts = async () => {
        if (!user?.key) return;
        setLoading(true);
        const { data } = await supabase
            .from('shop_products')
            .select('*')
            .eq('owner_key', user.key)
            .order('created_at', { ascending: false });

        if (data) setProducts(data);
        setLoading(false);
    };

    const fetchOrders = async () => {
        if (!user?.key) return;
        setLoading(true);
        const { data } = await supabase
            .from('shop_orders')
            .select('*')
            .eq('owner_key', user.key)
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
        setLoading(false);
    };

    // Metrics Calculations
    const metrics = useMemo(() => {
        const activeProducts = products.filter(p => p.active).length;
        const inactiveProducts = products.length - activeProducts;
        const lowStockProducts = products.filter(p => p.stock <= 1 && p.active).length;

        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'paid' || o.status === 'shipped').length;
        const totalRevenue = orders
            .filter(o => o.status === 'paid' || o.status === 'shipped')
            .reduce((sum, o) => sum + o.total, 0);

        // Best selling product (most times ordered)
        const productSales: Record<number, number> = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.id] = (productSales[item.id] || 0) + item.qty;
            });
        });
        const bestSellingId = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0];
        const bestSellingProduct = bestSellingId ? products.find(p => p.id === parseInt(bestSellingId)) : null;

        return {
            activeProducts,
            inactiveProducts,
            lowStockProducts,
            pendingOrders,
            completedOrders,
            totalRevenue,
            bestSellingProduct
        };
    }, [products, orders]);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'stock': return a.stock - b.stock;
                case 'newest':
                default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
        });

        return sorted;
    }, [products, searchTerm, categoryFilter, sortBy]);

    // Filtered Orders
    const filteredOrders = useMemo(() => {
        if (orderStatusFilter === 'all') return orders;
        return orders.filter(o => o.status === orderStatusFilter);
    }, [orders, orderStatusFilter]);

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.key}/${fileName}`;

        setUploading(true);
        const { error: uploadError } = await supabase.storage
            .from('shop')
            .upload(filePath, file);

        if (uploadError) {
            showToast(t('shop.messages.uploadError') + ': ' + uploadError.message, 'error');
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('shop').getPublicUrl(filePath);
        setFormImage(data.publicUrl);
        setUploading(false);
    };

    const handleSaveProduct = async () => {
        if (!formTitle || !formPrice) {
            showToast(t('shop.messages.requiredFields'), 'error');
            return;
        }

        const payload = {
            owner_key: user?.key,
            title: formTitle,
            description: formDescription || null,
            price: parseFloat(formPrice),
            stock: parseInt(formStock),
            image_url: formImage || 'https://via.placeholder.com/300',
            active: true,
            category: formCategory
        };

        setLoading(true);
        if (editingProduct) {
            await supabase.from('shop_products').update(payload).eq('id', editingProduct.id);
            showToast(t('shop.messages.updated'), 'success');
        } else {
            await supabase.from('shop_products').insert(payload);
            showToast(t('shop.messages.created'), 'success');
        }

        setModalVisible(false);
        resetForm();
        fetchProducts();
        setLoading(false);
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm(t('shop.messages.confirmDelete'))) return;
        const { error } = await supabase.from('shop_products').delete().eq('id', id);
        if (!error) {
            showToast(t('shop.messages.deleted'), 'success');
            fetchProducts();
        }
    };

    const handleDuplicateProduct = (p: ShopProduct) => {
        setEditingProduct(null);
        setFormTitle(p.title + ' (Copia)');
        setFormDescription(p.description || '');
        setFormPrice(p.price.toString());
        setFormStock(p.stock.toString());
        setFormImage(p.image_url);
        setFormCategory(p.category);
        setModalVisible(true);
    };

    const handleEditProduct = (p: ShopProduct) => {
        setEditingProduct(p);
        setFormTitle(p.title);
        setFormDescription(p.description || '');
        setFormPrice(p.price.toString());
        setFormStock(p.stock.toString());
        setFormImage(p.image_url);
        setFormCategory((p.category as any) || 'plant');
        setModalVisible(true);
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormTitle('');
        setFormDescription('');
        setFormPrice('');
        setFormStock('1');
        setFormImage('');
        setFormCategory('plant');
    };

    const toggleProductActive = async (p: ShopProduct) => {
        const newStatus = !p.active;
        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, active: newStatus } : item));
        await supabase.from('shop_products').update({ active: newStatus }).eq('id', p.id);
        showToast(newStatus ? t('shop.messages.activated') : t('shop.messages.deactivated'), 'success');
    };

    const toggleFeatured = async (p: ShopProduct) => {
        setProducts(prev => prev.map(item => ({
            ...item,
            is_featured: item.id === p.id
        })));

        await supabase.from('shop_products').update({ is_featured: false }).eq('owner_key', user?.key);
        await supabase.from('shop_products').update({ is_featured: true }).eq('id', p.id);
        showToast(t('shop.messages.featuredUpdated'), 'success');
    };

    const updateOrderStatus = async (orderId: number, newStatus: 'pending' | 'paid' | 'shipped' | 'cancelled') => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('shop_orders').update({ status: newStatus }).eq('id', orderId);
        showToast(t('shop.messages.statusUpdated'), 'success');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(t('shop.messages.copied'), 'success');
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const exportOrdersCSV = () => {
        const headers = ['ID', 'Cliente', 'Contacto', 'Total', 'Estado', 'Fecha'];
        const rows = filteredOrders.map(o => [
            o.id,
            o.customer_name,
            o.customer_contact,
            o.total,
            o.status,
            new Date(o.created_at).toLocaleString()
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showToast(t('shop.messages.exported'), 'success');
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { label: t('shop.orders.status.pending'), color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500' };
            case 'paid': return { label: t('shop.orders.status.paid'), color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500' };
            case 'shipped': return { label: t('shop.orders.status.shipped'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500' };
            case 'cancelled': return { label: t('shop.orders.status.cancelled'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500' };
            default: return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500' };
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 pb-24 md:p-8">
            {/* TOAST */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'success' ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400' : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400'} text-white`}>
                    <div className="flex items-center gap-3">
                        <div className="text-[20px]">{toast.type === 'success' ? '✓' : '⚠️'}</div>
                        <p className="font-bold text-[13px]">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="glass-panel p-6 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 mb-2">
                        {t('shop.title')}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <a href={shopUrl} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">
                            {t('shop.viewShop')} <ExternalLink size={10} />
                        </a>
                        <button onClick={() => copyToClipboard(shopUrl)} className="text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors">
                            <Copy size={10} /> {t('shop.copyLink')}
                        </button>
                        <button onClick={() => setQrModalVisible(true)} className="text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors">
                            <QrCode size={10} /> {t('shop.qrCode')}
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'catalog' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Package size={18} /> {t('shop.tabs.catalog')}
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all relative ${activeTab === 'orders' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <ClipboardList size={18} /> {t('shop.tabs.orders')}
                        {metrics.pendingOrders > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {metrics.pendingOrders}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Settings size={18} /> {t('shop.tabs.settings')}
                    </button>
                </div>
            </div>

            {/* METRICS DASHBOARD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-panel p-4 border-l-4 border-teal-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-teal-400" size={20} />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{t('shop.metrics.products')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.activeProducts}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{metrics.inactiveProducts} {t('shop.metrics.inactive')}</div>
                </div>

                <div className="glass-panel p-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-amber-400" size={20} />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{t('shop.metrics.lowStock')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.lowStockProducts}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{t('shop.metrics.lowStockDesc')}</div>
                </div>

                <div className="glass-panel p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-green-400" size={20} />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{t('shop.metrics.revenue')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${metrics.totalRevenue}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{metrics.completedOrders} {t('shop.metrics.completed')}</div>
                </div>

                <div className="glass-panel p-4 border-l-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-purple-400" size={20} />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{t('shop.metrics.bestSeller')}</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">{metrics.bestSellingProduct?.title || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{t('shop.metrics.bestSellerDesc')}</div>
                </div>
            </div>

            {loading && <div className="text-center text-teal-400 my-4 animate-pulse">{t('shop.loading')}</div>}

            {/* CATALOG VIEW */}
            {activeTab === 'catalog' && (
                <div>
                    {/* Search & Filters */}
                    <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('shop.catalog.searchPlaceholder')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 outline-none">
                            <option value="all">{t('shop.catalog.allCategories')}</option>
                            <option value="plant">{t('shop.catalog.plants')}</option>
                            <option value="supply">{t('shop.catalog.supplies')}</option>
                            <option value="merch">{t('shop.catalog.merch')}</option>
                        </select>

                        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 outline-none">
                            <option value="newest">{t('shop.catalog.newest')}</option>
                            <option value="price-low">{t('shop.catalog.priceLow')}</option>
                            <option value="price-high">{t('shop.catalog.priceHigh')}</option>
                            <option value="stock">{t('shop.catalog.minStock')}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add Button Card */}
                        <div
                            onClick={() => { resetForm(); setModalVisible(true); }}
                            className="glass-panel p-6 border-dashed border-2 border-slate-700 hover:border-teal-500/50 cursor-pointer flex flex-col items-center justify-center min-h-[250px] group transition-all"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-teal-500 flex items-center justify-center transition-colors mb-3">
                                <Plus className="text-teal-400 group-hover:text-white" size={28} />
                            </div>
                            <span className="text-slate-400 group-hover:text-teal-300 font-bold">{t('shop.catalog.newProduct')}</span>
                        </div>

                        {filteredProducts.map(p => (
                            <div key={p.id} className={`glass-panel p-4 flex flex-col gap-3 relative transition-all hover:scale-[1.02] ${!p.active && 'opacity-60 grayscale'}`}>
                                <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden group">
                                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold text-teal-400">
                                        ${p.price}
                                    </div>
                                    {p.is_featured && (
                                        <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                                            <Star size={12} fill="white" /> {t('shop.catalog.featured')}
                                        </div>
                                    )}
                                    {p.stock <= 1 && p.stock > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-orange-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white animate-pulse">
                                            ⚡ {t('shop.catalog.lastUnit')}
                                        </div>
                                    )}
                                    {p.stock === 0 && (
                                        <div className="absolute bottom-2 left-2 bg-red-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white">
                                            {t('shop.catalog.outOfStock')}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-200 mb-1 line-clamp-1">{p.title}</h3>
                                    {p.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`px-2 py-1 rounded ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : p.stock <= 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-teal-500/20 text-teal-400'}`}>
                                            {t('shop.catalog.stock')}: {p.stock}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-slate-700 text-slate-300">
                                            {p.category === 'plant' ? `🌿 ${t('shop.catalog.plants')}` : p.category === 'supply' ? `🧪 ${t('shop.catalog.supplies')}` : `🎁 ${t('shop.catalog.merch')}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-slate-700/50 pt-3 mt-1">
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={p.active} onChange={() => toggleProductActive(p)} className="accent-teal-500" />
                                        {p.active ? <span className="text-teal-400 flex items-center gap-1"><Eye size={12} /> {t('shop.catalog.visible')}</span> : <span className="text-slate-500 flex items-center gap-1"><EyeOff size={12} /> {t('shop.catalog.hidden')}</span>}
                                    </label>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => toggleFeatured(p)}
                                            className={`p-2 hover:bg-slate-700 rounded-full transition-colors ${p.is_featured ? 'text-amber-400' : 'text-slate-600 hover:text-amber-200'}`}
                                            title="Destacar"
                                        >
                                            <Star size={14} fill={p.is_featured ? "currentColor" : "none"} />
                                        </button>
                                        <button onClick={() => handleDuplicateProduct(p)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-400 transition-colors" title="Duplicar">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={() => handleEditProduct(p)} className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-teal-400 transition-colors" title="Editar">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-red-500/20 rounded-full text-red-400 transition-colors" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ORDERS VIEW */}
            {activeTab === 'orders' && (
                <div>
                    {/* Order Filters */}
                    <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-3">
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setOrderStatusFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${orderStatusFilter === 'all' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {t('shop.orders.all')} ({orders.length})
                            </button>
                            <button onClick={() => setOrderStatusFilter('pending')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${orderStatusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {t('shop.orders.pending')} ({orders.filter(o => o.status === 'pending').length})
                            </button>
                            <button onClick={() => setOrderStatusFilter('paid')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${orderStatusFilter === 'paid' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {t('shop.orders.paid')} ({orders.filter(o => o.status === 'paid').length})
                            </button>
                            <button onClick={() => setOrderStatusFilter('shipped')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${orderStatusFilter === 'shipped' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                {t('shop.orders.shipped')} ({orders.filter(o => o.status === 'shipped').length})
                            </button>
                        </div>
                        <button onClick={exportOrdersCSV} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                            <Download size={14} /> {t('shop.orders.exportCSV')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {filteredOrders.length === 0 && !loading && (
                            <div className="glass-panel py-20 text-center">
                                <ClipboardList className="mx-auto mb-4 text-slate-600" size={48} />
                                <p className="text-slate-500">{t('shop.orders.noOrders')}</p>
                            </div>
                        )}
                        {filteredOrders.map(order => {
                            const statusConfig = getStatusConfig(order.status);
                            return (
                                <div key={order.id} className="glass-panel p-6 flex flex-col lg:flex-row justify-between gap-6 hover:border-teal-500/30 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="font-bold text-xl text-teal-300">#{order.id} - {order.customer_name}</h3>
                                            <span className={`text-xs px-3 py-1 rounded-full border font-bold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                                {statusConfig.label.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                                            📅 {new Date(order.created_at).toLocaleString('es-ES')}
                                        </p>

                                        <div className="space-y-2 pl-4 border-l-2 border-slate-700">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm text-slate-300 w-full max-w-md">
                                                    <span className="font-medium">{item.qty}x {item.title}</span>
                                                    <span className="text-slate-500">${item.price * item.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between min-w-[240px] gap-4">
                                        <div className="text-3xl font-bold text-white">{t('shop.orders.total')}: ${order.total}</div>

                                        {/* Status Actions */}
                                        <div className="w-full space-y-2">
                                            <div className="text-xs text-slate-400 mb-2">{t('shop.orders.changeStatus')}:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'paid')}
                                                    disabled={order.status === 'paid'}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg transition-colors font-bold flex items-center justify-center gap-1"
                                                >
                                                    <Check size={12} /> {t('shop.orders.status.paid')}
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                    disabled={order.status === 'shipped'}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg transition-colors font-bold"
                                                >
                                                    {t('shop.orders.status.shipped')}
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'pending')}
                                                    disabled={order.status === 'pending'}
                                                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg transition-colors font-bold"
                                                >
                                                    {t('shop.orders.status.pending')}
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                    disabled={order.status === 'cancelled'}
                                                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs rounded-lg transition-colors font-bold"
                                                >
                                                    {t('shop.orders.status.cancelled')}
                                                </button>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://wa.me/${order.customer_contact.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
                                        >
                                            <MessageCircle size={16} /> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto">
                    <div className="glass-panel p-8">
                        <h2 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-2">
                            <User size={24} /> {t('shop.settings.profileTitle')}
                        </h2>
                        <p className="text-sm text-slate-400 mb-6">
                            {t('shop.settings.profileDesc')}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.settings.shopName')}</label>
                                <input
                                    type="text"
                                    value={shopProfile.name}
                                    onChange={e => setShopProfile(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej. CarniLab Vivero"
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.settings.bio')}</label>
                                <textarea
                                    value={shopProfile.bio}
                                    onChange={e => setShopProfile(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Cuéntale a tus clientes sobre tu tienda..."
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.settings.specialty')}</label>
                                <input
                                    type="text"
                                    value={shopProfile.specialty || ''}
                                    onChange={e => setShopProfile(prev => ({ ...prev, specialty: e.target.value }))}
                                    placeholder="Ej. Especialistas en Nepenthes"
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                />
                            </div>

                            <div className="border-t border-slate-700 pt-6 mt-6">
                                <h3 className="text-lg font-bold text-slate-300 mb-4">{t('shop.settings.social')}</h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Instagram className="text-pink-400" size={20} />
                                        <input
                                            type="text"
                                            value={shopProfile.instagram || ''}
                                            onChange={e => setShopProfile(prev => ({ ...prev, instagram: e.target.value }))}
                                            placeholder="Usuario de Instagram (sin @)"
                                            className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="text-green-400" size={20} />
                                        <input
                                            type="text"
                                            value={shopProfile.whatsapp || ''}
                                            onChange={e => setShopProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                                            placeholder="WhatsApp (con código país, ej. 5491234567890)"
                                            className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Mail className="text-blue-400" size={20} />
                                        <input
                                            type="email"
                                            value={shopProfile.email || ''}
                                            onChange={e => setShopProfile(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="Email de contacto"
                                            className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    // TODO: Save to database (new table: shop_profiles)
                                    showToast('Perfil guardado (próximamente se guardará en la base de datos)', 'success');
                                }}
                                className="w-full mt-6 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20"
                            >
                                {t('shop.settings.save')}
                            </button>

                            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-400 flex items-center gap-2">
                                    <AlertCircle size={14} /> <strong>Nota:</strong> {t('shop.settings.note')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT MODAL */}
            {modalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-2xl p-8 bg-[#1a1a2e] border border-slate-700 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setModalVisible(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">
                            {editingProduct ? t('shop.modal.editProduct') : t('shop.modal.newProduct')}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.title')} *</label>
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors"
                                    placeholder="Ej. Venus Flytrap 'Red Dragon'"
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.description')}</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none transition-colors resize-none"
                                    placeholder="Describe las características, cuidados, tamaño..."
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.price')} * ($)</label>
                                    <input
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none"
                                        placeholder="0.00"
                                        type="number"
                                        step="0.01"
                                        value={formPrice}
                                        onChange={e => setFormPrice(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.stock')}</label>
                                    <input
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none"
                                        placeholder="1"
                                        type="number"
                                        value={formStock}
                                        onChange={e => setFormStock(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.category')}</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white focus:border-teal-500 outline-none"
                                    value={formCategory}
                                    onChange={e => setFormCategory(e.target.value as any)}
                                >
                                    <option value="plant">🌿 {t('shop.catalog.plants')}</option>
                                    <option value="supply">🧪 {t('shop.catalog.supplies')}</option>
                                    <option value="merch">🎁 {t('shop.catalog.merch')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">{t('shop.modal.image')}</label>
                                <label className={`w-full bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/50 p-4 rounded-lg text-center cursor-pointer transition-colors flex items-center justify-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploading ? `⏳ ${t('shop.modal.uploading')}` : (formImage ? `🖼️ ${t('shop.modal.changeImage')}` : `📤 ${t('shop.modal.uploadImage')}`)}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            {formImage && (
                                <div className="relative">
                                    <img src={formImage} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-slate-700" />
                                    <button
                                        onClick={() => setFormImage('')}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setModalVisible(false)}
                                className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-bold"
                            >
                                {t('shop.modal.cancel')}
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors shadow-lg shadow-teal-500/20"
                            >
                                {editingProduct ? t('shop.modal.update') : t('shop.modal.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR CODE MODAL */}
            {qrModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setQrModalVisible(false)}>
                    <div className="glass-panel w-full max-w-md p-8 bg-[#1a1a2e] border border-slate-700 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setQrModalVisible(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-center text-teal-400 flex items-center justify-center gap-2">
                            <QrCode size={24} /> {t('shop.qrCode')}
                        </h2>

                        <div className="bg-white p-6 rounded-lg mb-6">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}`}
                                alt="QR Code"
                                className="w-full h-auto"
                            />
                        </div>

                        <p className="text-center text-sm text-slate-400 mb-4">
                            Comparte este código QR para que tus clientes accedan a tu tienda
                        </p>

                        <button
                            onClick={() => copyToClipboard(shopUrl)}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Copy size={16} /> {t('shop.copyLink')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
