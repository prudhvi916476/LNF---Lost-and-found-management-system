'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, ArrowRight, Upload, MapPin, Calendar, Phone,
  DollarSign, CheckCircle2, Loader2, Camera, X, Package
} from 'lucide-react';
import { itemsApi, uploadApi } from '@/lib/api';

const CATEGORIES = [
  'Electronics', 'Phone', 'Laptop', 'Tablet', 'Wallet', 'Keys', 'Bag', 'Backpack',
  'Clothing', 'Jewelry', 'Watch', 'Glasses', 'Headphones', 'Documents', 'ID Card',
  'Passport', 'Book', 'Umbrella', 'Water Bottle', 'Sports Equipment', 'Bicycle', 'Other',
];

const Map = dynamic(() => import('@/components/ui/map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/[0.04] animate-pulse rounded-2xl flex items-center justify-center text-white/50">Loading map...</div>
});

const COLORS = [
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Purple', 'Pink', 'Brown', 'Gold', 'Navy', 'Teal',
];

export default function ReportLostPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '', category: '', brand: '', model: '', color: '',
    description: '', serialNumber: '', locationAddress: '', landmark: '',
    city: '', state: '', country: '', lostDate: '', lostTimeApprox: '',
    contactPreference: 'in_app', rewardAmount: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | undefined>(undefined);

  const handleMapClick = async (lat: number, lng: number) => {
    setMapPosition([lat, lng]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || '';
        const address = data.display_name || '';
        setFormData(prev => ({ ...prev, locationAddress: address, city: city }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.locationAddress) return;
    setIsLocating(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.locationAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapPosition([lat, lng]);
      }
    } catch (e) {
      console.error('Failed to geocode address', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || '';
              const address = data.display_name || '';
              
              setFormData(prev => ({
                ...prev,
                locationAddress: address,
                city: city
              }));
              setMapPosition([latitude, longitude]);
            }
          } catch (error) {
            console.error('Error fetching address:', error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          alert('Could not get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const res = await uploadApi.uploadFile(file);
          if (res.data?.data?.url) {
            setImages(prev => [...prev, res.data.data.url]);
          }
        } catch (err) {
          console.error("Failed to upload file", err);
          alert("Failed to upload " + file.name);
        }
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const totalSteps = 5;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        itemName: formData.itemName,
        category: formData.category || 'Other',
        description: formData.description,
        contactPreference: formData.contactPreference,
      };

      if (formData.brand) payload.brand = formData.brand;
      if (formData.model) payload.model = formData.model;
      if (formData.color) payload.color = formData.color;
      if (formData.serialNumber) payload.serialNumber = formData.serialNumber;
      if (formData.locationAddress) payload.locationAddress = formData.locationAddress;
      if (formData.landmark) payload.landmark = formData.landmark;
      if (formData.city) payload.city = formData.city;
      if (formData.state) payload.state = formData.state;
      if (formData.country) payload.country = formData.country;
      
      if (formData.lostDate) {
        payload.lostDate = new Date(formData.lostDate).toISOString();
      }
      if (formData.lostTimeApprox) payload.lostTimeApprox = formData.lostTimeApprox;
      
      if (mapPosition) {
        payload.locationLat = mapPosition[0];
        payload.locationLng = mapPosition[1];
      }
      
      if (images.length > 0) {
        payload.imageUrls = images;
      }
      
      if (formData.rewardAmount) {
        payload.rewardAmount = parseFloat(formData.rewardAmount);
      }

      await itemsApi.createLostItem(payload);
      setStep(6); // success
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error);
      alert(`Failed to submit report: ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-2 rounded-xl hover:bg-white/[0.04] text-white/60 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Report Lost Item</h1>
          <p className="text-white/60 text-sm">Fill in the details to help us find your item</p>
        </div>
      </div>

      {/* Progress bar */}
      {step <= totalSteps && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-6 lg:p-8 shadow-sm">
        {/* Step 1: Item Details */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-white">Item Details</h2>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Item Name *</label>
              <input value={formData.itemName} onChange={(e) => updateField('itemName', e.target.value)} placeholder="e.g., Black Samsung Galaxy S24" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Category *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => updateField('category', cat)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${formData.category === cat ? 'bg-primary-500 text-white shadow-md' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] border border-white/[0.12]'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Brand</label>
                <input value={formData.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="e.g., Samsung, Apple" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Model</label>
                <input value={formData.model} onChange={(e) => updateField('model', e.target.value)} placeholder="e.g., Galaxy S24" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button key={color} onClick={() => updateField('color', color)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.color === color ? 'bg-primary-500 text-white' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] border border-white/[0.12]'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Description *</label>
              <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3} placeholder="Describe your item in detail - any scratches, stickers, unique features..." className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Serial Number <span className="text-white/50">(optional)</span></label>
              <input value={formData.serialNumber} onChange={(e) => updateField('serialNumber', e.target.value)} placeholder="Device serial or IMEI number" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-white">Upload Photos</h2>
            <p className="text-sm text-white/60">Add photos of your item to help with matching. More photos = better matches!</p>

            <label className="block border-2 border-dashed border-white/[0.12] rounded-2xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Drag and drop photos here</p>
                  <p className="text-xs text-white/50 mt-1">or click to browse • PNG, JPG up to 10MB</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 text-sm font-medium hover:bg-primary-500/20 transition-all cursor-pointer">
                    <Upload className="w-4 h-4 inline mr-1.5" />Browse Files
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/[0.02] text-white/70 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer">
                    <Camera className="w-4 h-4 inline mr-1.5" />Use Camera
                  </div>
                </div>
              </div>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl bg-white/[0.04] border border-white/[0.12] flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.preventDefault(); setImages(images.filter((_, idx) => idx !== i)); }} className="absolute top-2 right-2 p-1 rounded-full bg-surface-900/50 text-white hover:bg-surface-900/70 transition-colors z-10">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-white">Where did you lose it?</h2>

            <div className="h-64 w-full relative z-0">
              <Map position={mapPosition} onPositionChange={handleMapClick} />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={(e) => { e.preventDefault(); handleCurrentLocation(); }} 
                disabled={isLocating}
                className="text-xs text-primary-500 font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? 'Locating...' : 'Use my current location'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Address / Location</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input 
                  value={formData.locationAddress} 
                  onChange={(e) => updateField('locationAddress', e.target.value)} 
                  onBlur={handleAddressSearch}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddressSearch(); } }}
                  placeholder="e.g., Central Library, Main Campus" 
                  className="w-full pl-12 pr-24 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                />
                <button 
                  onClick={(e) => { e.preventDefault(); handleAddressSearch(); }}
                  disabled={isLocating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500/20 text-primary-300 hover:bg-primary-200 transition-colors disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">City</label>
                <input value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="City" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Landmark</label>
                <input value={formData.landmark} onChange={(e) => updateField('landmark', e.target.value)} placeholder="Near landmark" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Date & Time */}
        {step === 4 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-white">When did you lose it?</h2>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Date Lost</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input type="date" max={new Date().toISOString().split('T')[0]} value={formData.lostDate} onChange={(e) => updateField('lostDate', e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Approximate Time</label>
              <div className="grid grid-cols-4 gap-2">
                {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                  <button key={time} onClick={() => updateField('lostTimeApprox', time)} className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${formData.lostTimeApprox === time ? 'bg-primary-500 text-white shadow-md' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] border border-white/[0.12]'}`}>
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Contact Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'in_app', label: 'In-App', icon: '💬' },
                  { value: 'email', label: 'Email', icon: '📧' },
                  { value: 'phone', label: 'Phone', icon: '📱' },
                ].map((option) => (
                  <button key={option.value} onClick={() => updateField('contactPreference', option.value)} className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${formData.contactPreference === option.value ? 'bg-primary-500 text-white shadow-md' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] border border-white/[0.12]'}`}>
                    <span className="text-lg mb-1 block">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Reward <span className="text-white/50">(optional)</span></label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input type="number" value={formData.rewardAmount} onChange={(e) => updateField('rewardAmount', e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-white">Review Your Report</h2>
            <div className="space-y-4">
              {[
                { label: 'Item', value: `${formData.itemName} (${formData.category})` },
                { label: 'Brand / Model', value: `${formData.brand || '-'} ${formData.model || ''}` },
                { label: 'Color', value: formData.color || '-' },
                { label: 'Description', value: formData.description || '-' },
                { label: 'Location', value: formData.locationAddress || formData.city || '-' },
                { label: 'Date Lost', value: formData.lostDate || '-' },
                { label: 'Time', value: formData.lostTimeApprox || '-' },
                { label: 'Reward', value: formData.rewardAmount ? `$${formData.rewardAmount}` : 'None' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-2 border-b border-white/[0.08] last:border-0">
                  <span className="text-sm text-white/60">{item.label}</span>
                  <span className="text-sm font-medium text-white text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="text-center py-8 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Report Submitted!</h2>
            <p className="text-white/60 mt-2 max-w-md mx-auto">
              Your lost item report has been submitted. Our AI will start scanning for matches immediately.
              You&apos;ll be notified when a potential match is found.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-white/[0.04] text-white/80 font-medium hover:bg-white/[0.08] transition-all">
                Go to Dashboard
              </button>
              <button onClick={() => router.push('/dashboard/search')} className="px-6 py-3 rounded-xl gradient-primary text-white font-medium shadow-glow hover:shadow-xl transition-all">
                Search Items
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step <= totalSteps && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/[0.02] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
