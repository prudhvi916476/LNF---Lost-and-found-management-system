'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, ArrowRight, Upload, MapPin, Calendar,
  CheckCircle2, Loader2, X, Plus, HelpCircle, ShieldCheck,
  Eye, EyeOff, Image as ImageIcon,
} from 'lucide-react';
import { itemsApi, uploadApi } from '@/lib/api';
import { toast } from 'sonner';
import { geocodeAddress, reverseGeocode } from '@/lib/geocoding';

const Map = dynamic(() => import('@/components/ui/map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white/[0.04] animate-pulse rounded-2xl flex items-center justify-center text-white/50">Loading map...</div>,
});

const CATEGORIES = [
  'Electronics', 'Phone', 'Laptop', 'Tablet', 'Wallet', 'Keys',
  'Bag', 'Backpack', 'Clothing', 'Jewelry', 'Watch', 'Glasses',
  'Headphones', 'Documents', 'Other',
];

interface UploadedImage {
  originalUrl: string;
  previewUrl: string;
  localPreview: string; // blob URL for UI preview
  name: string;
}

export default function ReportFoundPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '', category: '', description: '', color: '',
    locationAddress: '', city: '', foundDate: '',
    storage: 'personal', storageDetails: '',
  });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [mapPosition, setMapPosition] = useState<[number, number] | undefined>(undefined);

  // Custom verification questions (step 3)
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  const handleMapClick = async (lat: number, lng: number) => {
    setMapPosition([lat, lng]);
    setCoords({ lat, lng });
    const geo = await reverseGeocode(lat, lng);
    if (geo) {
      setFormData(prev => ({ ...prev, locationAddress: geo.address, city: geo.city || prev.city }));
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.locationAddress) return;
    setIsLocating(true);
    try {
      const geo = await geocodeAddress(formData.locationAddress);
      if (geo) {
        setMapPosition([geo.lat, geo.lng]);
        setCoords({ lat: geo.lat, lng: geo.lng });
        if (geo.city) {
          setFormData(prev => ({ ...prev, city: geo.city }));
        }
        toast.success('Location found on map');
      } else {
        toast.error('Location not found. Try searching by city or landmark.');
      }
    } catch {
      toast.error('Location search failed. Please pin directly on map.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            setCoords({ lat: latitude, lng: longitude });
            setMapPosition([latitude, longitude]);
            const geo = await reverseGeocode(latitude, longitude);
            if (geo) {
              setFormData(prev => ({ ...prev, locationAddress: geo.address, city: geo.city || prev.city }));
              toast.success('Current location detected');
            }
          } catch {
            // Location obtained even if address reverse geocode fails
          } finally {
            setIsLocating(false);
          }
        },
        (err) => {
          toast.error('Could not get location: ' + err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation not supported by your browser');
      setIsLocating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploadingImages(true);
    for (const file of files) {
      const localPreview = URL.createObjectURL(file);
      try {
        const res = await uploadApi.uploadFoundItemImage(file, (pct) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
        });
        const { originalUrl, previewUrl } = res.data.data;
        setImages(prev => [...prev, { originalUrl, previewUrl, localPreview, name: file.name }]);
      } catch (err) {
        console.error('Upload failed for', file.name, err);
        alert(`Failed to upload ${file.name}. Please try again.`);
      } finally {
        setUploadProgress(prev => { const n = { ...prev }; delete n[file.name]; return n; });
      }
    }
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].localPreview);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomQuestion = () => {
    const trimmed = newQuestion.trim();
    if (!trimmed || customQuestions.length >= 5) return;
    setCustomQuestions(prev => [...prev, trimmed]);
    setNewQuestion('');
  };

  const removeCustomQuestion = (index: number) =>
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));

  const updateField = (field: string, value: string) =>
    setFormData(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.itemName.trim()) { alert('Please enter what you found.'); return; }
    setIsSubmitting(true);
    try {
      const payload: any = {
        itemName: formData.itemName,
        category: formData.category || 'Other',
        description: formData.description,
        storage: formData.storage,
      };
      if (formData.color) payload.color = formData.color;
      if (formData.locationAddress) payload.locationAddress = formData.locationAddress;
      if (formData.city) payload.city = formData.city;
      if (formData.storageDetails) payload.storageDetails = formData.storageDetails;
      if (formData.foundDate) payload.foundDate = new Date(formData.foundDate).toISOString();
      if (mapPosition) { payload.locationLat = mapPosition[0]; payload.locationLng = mapPosition[1]; }
      else if (coords.lat && coords.lng) { payload.locationLat = coords.lat; payload.locationLng = coords.lng; }

      // Send images with both original URL and negative preview URL
      if (images.length > 0) {
        payload.imageUrls = images.map(img => img.originalUrl || img.previewUrl);
        payload.images = images.map(img => ({ url: img.originalUrl, previewUrl: img.previewUrl }));
      }
      if (customQuestions.length > 0) payload.customQuestions = customQuestions;

      await itemsApi.createFoundItem(payload);
      setStep(5); // success
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error);
      alert(`Failed to submit report: ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="p-2 rounded-xl hover:bg-white/[0.04] text-white/60"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Report Found Item</h1>
          <p className="text-white/60 text-sm">Help someone get their item back</p>
        </div>
      </div>

      {step <= TOTAL_STEPS && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/50 mb-2">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {['Item Details', 'Location & Photos', 'Verification', 'Review'].map((label, i) => (
              <span key={label} className={`text-xs ${i + 1 === step ? 'text-accent-400 font-medium' : 'text-white/50'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl border border-white/[0.08] p-6 lg:p-8 shadow-sm">

        {/* Step 1: Item Details */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold">Item Details</h2>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">What did you find? *</label>
              <input
                value={formData.itemName}
                onChange={e => updateField('itemName', e.target.value)}
                placeholder="e.g., Black Phone, Brown Wallet"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateField('category', cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${formData.category === cat ? 'bg-accent-500 text-white shadow-md' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] border border-white/[0.12]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
                placeholder="Describe the item — brand, color, condition, identifying features..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Color</label>
                <input value={formData.color} onChange={e => updateField('color', e.target.value)} placeholder="e.g., Black" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Storage</label>
                <select value={formData.storage} onChange={e => updateField('storage', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all">
                  <option value="personal">With Me</option>
                  <option value="authority">Given to Authority</option>
                  <option value="org_desk">Lost & Found Desk</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Photos */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold">Location & Photos</h2>
            <div className="h-64 w-full relative z-0">
              <Map position={mapPosition} onPositionChange={handleMapClick} />
            </div>
            <div className="flex justify-end">
              <button
                onClick={e => { e.preventDefault(); handleCurrentLocation(); }}
                disabled={isLocating}
                className="text-xs text-accent-500 font-medium disabled:opacity-50 flex items-center gap-1"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? 'Locating...' : 'Use my current location'}
              </button>
            </div>
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                value={formData.locationAddress}
                onChange={e => updateField('locationAddress', e.target.value)}
                onBlur={handleAddressSearch}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddressSearch(); } }}
                placeholder="Where did you find it?"
                className="w-full pl-12 pr-24 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
              />
              <button
                onClick={e => { e.preventDefault(); handleAddressSearch(); }}
                disabled={isLocating}
                className="absolute right-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-500/20 text-accent-300 hover:bg-accent-200 transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">City</label>
              <input value={formData.city} onChange={e => updateField('city', e.target.value)} placeholder="City" className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Date Found</label>
              <input type="date" max={new Date().toISOString().split('T')[0]} value={formData.foundDate} onChange={e => updateField('foundDate', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all" />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Photos <span className="text-white/50 text-xs">(anonymised for privacy protection)</span>
              </label>
              <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Your uploaded images will be automatically processed into a grayscale negative preview.
                  The original image is stored privately and only revealed after a successful ownership verification.
                </p>
              </div>

              <label className="border-2 border-dashed border-white/[0.12] rounded-2xl p-6 text-center hover:border-accent-300 transition-colors cursor-pointer block">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
                    <p className="text-sm text-white/60">Processing & anonymising images...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60">Upload photos of the found item</p>
                    <p className="text-xs text-white/50 mt-1">PNG, JPG up to 10MB</p>
                  </>
                )}
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.12] group">
                      <img
                        src={img.previewUrl || img.localPreview}
                        alt={`Upload ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Preview overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <p className="text-white text-xs font-semibold">Anonymised Negative</p>
                        <p className="text-amber-300 text-[11px]">Public preview active</p>
                      </div>
                      <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-md rounded-md px-2 py-0.5 flex items-center gap-1 shadow">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <p className="text-white text-[10px] font-bold tracking-wide">NEGATIVE PREVIEW</p>
                      </div>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Custom Verification Questions */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary-500/20">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Ownership Verification Setup</h2>
                <p className="text-sm text-white/60 mt-1">
                  Every claimant must answer 8 fixed questions. You can optionally add up to 5 custom questions
                  that only the real owner would know.
                </p>
              </div>
            </div>

            {/* Mandatory questions info */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-4">
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary-500" />
                Fixed Questions (automatically asked)
              </h3>
              <div className="space-y-2">
                {[
                  'Where exactly did you lose this item?',
                  'Approximately when did you lose it?',
                  'Describe the item in detail.',
                  'What distinguishing features does it have?',
                  'If applicable, what was inside the item?',
                  'Explain why you believe this item belongs to you.',
                  'When was the last time you used it?',
                  'Mention anything only the true owner would know.',
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom questions */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent-500" />
                Your Custom Questions
                <span className="ml-auto text-xs text-white/50">{customQuestions.length}/5 added</span>
              </h3>

              {customQuestions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {customQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                      <span className="text-sm text-accent-300 flex-1">{q}</span>
                      <button onClick={() => removeCustomQuestion(i)} className="p-1 rounded-lg hover:bg-accent-200 text-accent-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {customQuestions.length < 5 && (
                <div className="flex gap-2">
                  <input
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomQuestion(); } }}
                    maxLength={200}
                    placeholder='e.g., "What sticker is on the back?" or "What is the wallpaper?"'
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm transition-all"
                  />
                  <button
                    onClick={addCustomQuestion}
                    disabled={!newQuestion.trim()}
                    className="px-4 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-accent-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-white/50 mt-2">
                Good examples: "What colour is the inside lining?", "What keychain was attached?", "What starts the serial number?"
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold">Review & Submit</h2>
            <div className="space-y-2">
              {[
                { label: 'Item', value: `${formData.itemName} (${formData.category || 'Other'})` },
                { label: 'Description', value: formData.description || '-' },
                { label: 'Color', value: formData.color || '-' },
                { label: 'Location', value: formData.locationAddress || formData.city || '-' },
                { label: 'Date Found', value: formData.foundDate || '-' },
                { label: 'Storage', value: { personal: 'With Me', authority: 'Given to Authority', org_desk: 'Lost & Found Desk' }[formData.storage] || formData.storage },
                { label: 'Photos', value: images.length > 0 ? `${images.length} image(s) (anonymised)` : 'None' },
                { label: 'Custom Questions', value: customQuestions.length > 0 ? `${customQuestions.length} question(s)` : 'None (8 fixed questions only)' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-white/[0.08] last:border-0">
                  <span className="text-sm text-white/60">{item.label}</span>
                  <span className="text-sm font-medium text-white text-right max-w-[55%] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-semibold mb-1">Secure by default</p>
                  <ul className="space-y-1 text-primary-400">
                    <li>• Uploaded images are anonymised before publishing</li>
                    <li>• Claimants must pass an 8-question ownership quiz</li>
                    <li>• Contact details are hidden until you approve</li>
                    <li>• Max 3 claim attempts per person to prevent spam</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center py-8 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">Thank You!</h2>
            <p className="text-white/60 mt-2">
              Your found item report is live. Images are anonymised and only visible as a grayscale preview.
              Our AI is already looking for potential owners.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-white/[0.04] text-white/80 font-medium hover:bg-white/[0.08] transition-all">Dashboard</button>
              <button onClick={() => router.push('/dashboard/search')} className="px-6 py-3 rounded-xl bg-accent-500 text-white font-medium shadow-md hover:shadow-lg transition-all">Search Items</button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step <= TOTAL_STEPS && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/[0.02] disabled:opacity-30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !formData.itemName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 text-white font-medium shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
