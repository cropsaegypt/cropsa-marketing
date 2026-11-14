import React, { useState, useMemo } from 'react';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  ChevronRight, 
  MapPin,
  Calendar,
  RefreshCw,
  Sparkles,
  Loader2,
  Share2,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import { Language, WeatherData } from '../types';
import { cn } from '../lib/utils';
import { generateWeatherAlertPost, GeneratedPost } from '../lib/gemini';
import { showToast } from './Toast';

interface AgriWeatherProps {
  lang: Language;
  onAddContent?: (item: any) => void;
  setActiveTab?: (tab: any) => void;
}

const EGYPT_REGIONS: WeatherData[] = [
  {
    governorate: 'Cairo',
    temp: 28,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 12,
    risk: 'Low',
    advice: 'Normal irrigation schedule. Good for harvesting cereals.',
    adviceAr: 'جدول ري طبيعي. وقت مناسب لحصاد الحبوب وتجفيفها.',
    forecast: [
      { day: 'Mon', temp: 28, condition: 'Sunny' },
      { day: 'Tue', temp: 30, condition: 'Sunny' },
      { day: 'Wed', temp: 29, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 26, condition: 'Cloudy' },
      { day: 'Sat', temp: 25, condition: 'Sunny' },
      { day: 'Sun', temp: 28, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Giza',
    temp: 29,
    condition: 'Sunny',
    humidity: 40,
    windSpeed: 10,
    risk: 'Low',
    advice: 'Ideal for potato cultivation. Monitor soil moisture in Giza farms.',
    adviceAr: 'مثالي لزراعة البطاطس. راكب رطوبة التربة في مزارع الجيزة.',
    forecast: [
      { day: 'Mon', temp: 29, condition: 'Sunny' },
      { day: 'Tue', temp: 31, condition: 'Sunny' },
      { day: 'Wed', temp: 30, condition: 'Sunny' },
      { day: 'Thu', temp: 28, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 27, condition: 'Cloudy' },
      { day: 'Sat', temp: 28, condition: 'Sunny' },
      { day: 'Sun', temp: 30, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Alexandria',
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 20,
    risk: 'Medium',
    advice: 'High humidity may lead to fungal diseases in cucumbers. Ventilate greenhouses.',
    adviceAr: 'الرطوبة العالية قد تشجع الأمراض الفطرية. يجب تهوية الصوب الزراعية جيداً.',
    forecast: [
      { day: 'Mon', temp: 22, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 23, condition: 'Cloudy' },
      { day: 'Wed', temp: 21, condition: 'Rain' },
      { day: 'Thu', temp: 20, condition: 'Rain' },
      { day: 'Fri', temp: 21, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 22, condition: 'Sunny' },
      { day: 'Sun', temp: 23, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Sharqia',
    temp: 27,
    condition: 'Sunny',
    humidity: 50,
    windSpeed: 12,
    risk: 'Low',
    advice: 'Good conditions for wheat and rice. Apply fertilization as scheduled.',
    adviceAr: 'ظروف جيدة للقمح والأرز. قم بإضافة التسميد حسب الجدول الزمني.',
    forecast: [
      { day: 'Mon', temp: 27, condition: 'Sunny' },
      { day: 'Tue', temp: 28, condition: 'Sunny' },
      { day: 'Wed', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 26, condition: 'Cloudy' },
      { day: 'Fri', temp: 25, condition: 'Sunny' },
      { day: 'Sat', temp: 26, condition: 'Sunny' },
      { day: 'Sun', temp: 28, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Monufia',
    temp: 27,
    condition: 'Sunny',
    humidity: 48,
    windSpeed: 11,
    risk: 'Low',
    advice: 'Perfect for clover cutting. Ensure proper drainage to avoid waterlogging.',
    adviceAr: 'وقت مثالي لحش البرسيم. تأكد من جودة الصرف لتجنب تراكم المياه.',
    forecast: [
      { day: 'Mon', temp: 27, condition: 'Sunny' },
      { day: 'Tue', temp: 28, condition: 'Sunny' },
      { day: 'Wed', temp: 27, condition: 'Sunny' },
      { day: 'Thu', temp: 26, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 25, condition: 'Cloudy' },
      { day: 'Sat', temp: 27, condition: 'Sunny' },
      { day: 'Sun', temp: 29, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Qalyubia',
    temp: 28,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 10,
    risk: 'Low',
    advice: 'Excellent for citrus orchards. Watch for spider mites during warm spells.',
    adviceAr: 'ممتاز لبساتين الموالح. احذر من العناكب الحمراء خلال الموجات الدافئة.',
    forecast: [
      { day: 'Mon', temp: 28, condition: 'Sunny' },
      { day: 'Tue', temp: 30, condition: 'Sunny' },
      { day: 'Wed', temp: 29, condition: 'Sunny' },
      { day: 'Thu', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 26, condition: 'Cloudy' },
      { day: 'Sat', temp: 27, condition: 'Sunny' },
      { day: 'Sun', temp: 29, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Minya',
    temp: 32,
    condition: 'Hot',
    humidity: 30,
    windSpeed: 15,
    risk: 'High',
    advice: 'Extreme heat warning. Increase irrigation for potatoes and grapes. Mulching recommended.',
    adviceAr: 'تحذير من حرارة شديدة. تقريب فترات الري للبطاطس والعنب. يفضل استخدام المالتش.',
    forecast: [
      { day: 'Mon', temp: 32, condition: 'Sunny' },
      { day: 'Tue', temp: 34, condition: 'Sunny' },
      { day: 'Wed', temp: 35, condition: 'Sunny' },
      { day: 'Thu', temp: 33, condition: 'Sunny' },
      { day: 'Fri', temp: 31, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 32, condition: 'Sunny' },
      { day: 'Sun', temp: 33, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Asyut',
    temp: 33,
    condition: 'Hot',
    humidity: 25,
    windSpeed: 16,
    risk: 'High',
    advice: 'Very low humidity. Risk of dehydration for pomegranate trees.',
    adviceAr: 'رطوبة منخفضة جداً. خطر الجفاف لأشجار الرمان والمحاصيل الصيفية.',
    forecast: [
      { day: 'Mon', temp: 33, condition: 'Sunny' },
      { day: 'Tue', temp: 35, condition: 'Sunny' },
      { day: 'Wed', temp: 36, condition: 'Sunny' },
      { day: 'Thu', temp: 34, condition: 'Hot' },
      { day: 'Fri', temp: 32, condition: 'Sunny' },
      { day: 'Sat', temp: 33, condition: 'Sunny' },
      { day: 'Sun', temp: 35, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Sohag',
    temp: 34,
    condition: 'Hot',
    humidity: 22,
    windSpeed: 18,
    risk: 'High',
    advice: 'Hot dry winds expected. Do not transplant seedlings today.',
    adviceAr: 'رياح ساخنة وجافة متوقعة. تجنب شتل الشتلات اليوم.',
    forecast: [
      { day: 'Mon', temp: 34, condition: 'Sunny' },
      { day: 'Tue', temp: 36, condition: 'Sunny' },
      { day: 'Wed', temp: 38, condition: 'Hot' },
      { day: 'Thu', temp: 36, condition: 'Sunny' },
      { day: 'Fri', temp: 33, condition: 'Sunny' },
      { day: 'Sat', temp: 34, condition: 'Sunny' },
      { day: 'Sun', temp: 36, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Qena',
    temp: 36,
    condition: 'Very Hot',
    humidity: 18,
    windSpeed: 20,
    risk: 'High',
    advice: 'Extreme heat. Water sugarcane fields abundantly during evening.',
    adviceAr: 'حرارة مفرطة. يجب ري حقول قصب السكر بوفرة خلال المساء.',
    forecast: [
      { day: 'Mon', temp: 36, condition: 'Hot' },
      { day: 'Tue', temp: 38, condition: 'Hot' },
      { day: 'Wed', temp: 40, condition: 'Hot' },
      { day: 'Thu', temp: 37, condition: 'Sunny' },
      { day: 'Fri', temp: 35, condition: 'Sunny' },
      { day: 'Sat', temp: 36, condition: 'Sunny' },
      { day: 'Sun', temp: 38, condition: 'Very Hot' },
    ]
  },
  {
    governorate: 'Aswan',
    temp: 38,
    condition: 'Very Hot',
    humidity: 15,
    windSpeed: 22,
    risk: 'High',
    advice: 'Avoid all outdoor agricultural activities during noon. Deep irrigation recommended.',
    adviceAr: 'تجنب كافة الأنشطة الزراعية الميدانية وقت الظهيرة. ينصح بالري العميق.',
    forecast: [
      { day: 'Mon', temp: 38, condition: 'Hot' },
      { day: 'Tue', temp: 40, condition: 'Hot' },
      { day: 'Wed', temp: 42, condition: 'Very Hot' },
      { day: 'Thu', temp: 39, condition: 'Hot' },
      { day: 'Fri', temp: 37, condition: 'Sunny' },
      { day: 'Sat', temp: 38, condition: 'Sunny' },
      { day: 'Sun', temp: 40, condition: 'Very Hot' },
    ]
  },
  {
    governorate: 'Faiyum',
    temp: 30,
    condition: 'Sunny',
    humidity: 38,
    windSpeed: 14,
    risk: 'Medium',
    advice: 'Good for medicinal plant harvests. Monitor saline levels in irrigation water.',
    adviceAr: 'مناسب لحصاد النباتات الطبية. راقب مستويات الملوحة في مياه الري.',
    forecast: [
      { day: 'Mon', temp: 30, condition: 'Sunny' },
      { day: 'Tue', temp: 32, condition: 'Sunny' },
      { day: 'Wed', temp: 31, condition: 'Sunny' },
      { day: 'Thu', temp: 29, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 28, condition: 'Sunny' },
      { day: 'Sat', temp: 29, condition: 'Sunny' },
      { day: 'Sun', temp: 31, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Beni Suef',
    temp: 31,
    condition: 'Sunny',
    humidity: 35,
    windSpeed: 13,
    risk: 'Medium',
    advice: 'Ideal for onion harvesting. Dry the crop in shade.',
    adviceAr: 'مثالي لحصاد البصل. يراعى تجفيف المحصول في مكان مظلل وجيد التهوية.',
    forecast: [
      { day: 'Mon', temp: 31, condition: 'Sunny' },
      { day: 'Tue', temp: 33, condition: 'Sunny' },
      { day: 'Wed', temp: 32, condition: 'Sunny' },
      { day: 'Thu', temp: 30, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 29, condition: 'Sunny' },
      { day: 'Sat', temp: 30, condition: 'Sunny' },
      { day: 'Sun', temp: 32, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Beheira',
    temp: 26,
    condition: 'Sunny',
    humidity: 50,
    windSpeed: 14,
    risk: 'Medium',
    advice: 'Watch for cotton leafworm in vegetable crops. Ideal for soil preparation.',
    adviceAr: 'كافح دودة ورق القطن في محاصيل الخضر. ظروف مثالية لتجهيز التربة للزراعات الجديدة.',
    forecast: [
      { day: 'Mon', temp: 26, condition: 'Sunny' },
      { day: 'Tue', temp: 27, condition: 'Sunny' },
      { day: 'Wed', temp: 25, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 24, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 23, condition: 'Cloudy' },
      { day: 'Sat', temp: 26, condition: 'Sunny' },
      { day: 'Sun', temp: 27, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Dakahlia',
    temp: 27,
    condition: 'Partly Cloudy',
    humidity: 55,
    windSpeed: 10,
    risk: 'Low',
    advice: 'Perfect for harvesting rice. Monitor insect populations in fruit trees.',
    adviceAr: 'ظروف ممتازة لحصاد الأرز. راقب نشاط الحشرات في بساتين الفاكهة.',
    forecast: [
      { day: 'Mon', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 28, condition: 'Sunny' },
      { day: 'Wed', temp: 26, condition: 'Sunny' },
      { day: 'Thu', temp: 25, condition: 'Cloudy' },
      { day: 'Fri', temp: 24, condition: 'Rain' },
      { day: 'Sat', temp: 25, condition: 'Sunny' },
      { day: 'Sun', temp: 28, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Gharbia',
    temp: 27,
    condition: 'Sunny',
    humidity: 48,
    windSpeed: 11,
    risk: 'Low',
    advice: 'Ideal for planting legumes. Keep soil moisture constant.',
    adviceAr: 'مثالي لزراعة البقوليات. حافظ على رطوبة التربة بشكل ثابت وتجنب التعطيش.',
    forecast: [
      { day: 'Mon', temp: 27, condition: 'Sunny' },
      { day: 'Tue', temp: 29, condition: 'Sunny' },
      { day: 'Wed', temp: 28, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 26, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 25, condition: 'Cloudy' },
      { day: 'Sat', temp: 27, condition: 'Sunny' },
      { day: 'Sun', temp: 29, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Kafr El Sheikh',
    temp: 23,
    condition: 'Cloudy',
    humidity: 70,
    windSpeed: 22,
    risk: 'Medium',
    advice: 'Sea breeze increasing humidity. Watch for potato blight.',
    adviceAr: 'هواء البحر يزيد من الرطوبة. احذر من الندوات في البطاطس والطماطم ورش وقائي.',
    forecast: [
      { day: 'Mon', temp: 23, condition: 'Cloudy' },
      { day: 'Tue', temp: 24, condition: 'Partly Cloudy' },
      { day: 'Wed', temp: 22, condition: 'Rain' },
      { day: 'Thu', temp: 21, condition: 'Rain' },
      { day: 'Fri', temp: 22, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 23, condition: 'Sunny' },
      { day: 'Sun', temp: 25, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Damietta',
    temp: 24,
    condition: 'Partly Cloudy',
    humidity: 68,
    windSpeed: 19,
    risk: 'Medium',
    advice: 'Check for downy mildew in grapevines.',
    adviceAr: 'افحص البياض الزغبي في كروم العنب. الرطوبة المرتفعة تشكل خطراً.',
    forecast: [
      { day: 'Mon', temp: 24, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 25, condition: 'Cloudy' },
      { day: 'Wed', temp: 23, condition: 'Rain' },
      { day: 'Thu', temp: 22, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 23, condition: 'Sunny' },
      { day: 'Sat', temp: 24, condition: 'Sunny' },
      { day: 'Sun', temp: 26, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Ismailia',
    temp: 28,
    condition: 'Sunny',
    humidity: 42,
    windSpeed: 14,
    risk: 'Low',
    advice: 'Great for mango orchard maintenance. Prune dead branches.',
    adviceAr: 'وقت رائع لصيانة بساتين المانجو. قم بتقليم الأفرع الميتة والجافة.',
    forecast: [
      { day: 'Mon', temp: 28, condition: 'Sunny' },
      { day: 'Tue', temp: 30, condition: 'Sunny' },
      { day: 'Wed', temp: 29, condition: 'Sunny' },
      { day: 'Thu', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 26, condition: 'Cloudy' },
      { day: 'Sat', temp: 27, condition: 'Sunny' },
      { day: 'Sun', temp: 29, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Suez',
    temp: 29,
    condition: 'Sunny',
    humidity: 40,
    windSpeed: 21,
    risk: 'Medium',
    advice: 'Strong winds. Ensure greenhouse structures are reinforced.',
    adviceAr: 'رياح قوية. تأكد من تقوية هياكل الصوب الزراعية وحماية الشتلات الضعيفة.',
    forecast: [
      { day: 'Mon', temp: 29, condition: 'Sunny' },
      { day: 'Tue', temp: 31, condition: 'Sunny' },
      { day: 'Wed', temp: 30, condition: 'Sunny' },
      { day: 'Thu', temp: 28, condition: 'Sunny' },
      { day: 'Fri', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 28, condition: 'Sunny' },
      { day: 'Sun', temp: 30, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Port Said',
    temp: 23,
    condition: 'Partly Cloudy',
    humidity: 72,
    windSpeed: 24,
    risk: 'Medium',
    advice: 'Salt spray hazard for coastal crops. Wash foliage if needed.',
    adviceAr: 'خطر رذاذ الملح على المحاصيل الساحلية. اغسل الأوراق بمياه عذبة إذا لزم الأمر.',
    forecast: [
      { day: 'Mon', temp: 23, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 24, condition: 'Cloudy' },
      { day: 'Wed', temp: 22, condition: 'Rain' },
      { day: 'Thu', temp: 21, condition: 'Rain' },
      { day: 'Fri', temp: 22, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 23, condition: 'Sunny' },
      { day: 'Sun', temp: 24, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Luxor',
    temp: 37,
    condition: 'Very Hot',
    humidity: 16,
    windSpeed: 12,
    risk: 'High',
    advice: 'Intense heat index. Harvest mangoes early in the morning.',
    adviceAr: 'مؤشر حرارة شديد. احصد المانجو في الصباح الباكر وتجنب شمس الظهيرة.',
    forecast: [
      { day: 'Mon', temp: 37, condition: 'Hot' },
      { day: 'Tue', temp: 39, condition: 'Hot' },
      { day: 'Wed', temp: 41, condition: 'Very Hot' },
      { day: 'Thu', temp: 38, condition: 'Hot' },
      { day: 'Fri', temp: 36, condition: 'Sunny' },
      { day: 'Sat', temp: 37, condition: 'Sunny' },
      { day: 'Sun', temp: 39, condition: 'Very Hot' },
    ]
  },
  {
    governorate: 'North Sinai',
    temp: 24,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 25,
    risk: 'Medium',
    advice: 'Windy conditions. Protect greenhouses from sand intrusion.',
    adviceAr: 'رياح محملة بالأتربة. احمِ الصوب الزراعية من الرمال وراقب الزيتون.',
    forecast: [
      { day: 'Mon', temp: 24, condition: 'Sunny' },
      { day: 'Tue', temp: 26, condition: 'Sunny' },
      { day: 'Wed', temp: 25, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 23, condition: 'Cloudy' },
      { day: 'Fri', temp: 22, condition: 'Sunny' },
      { day: 'Sat', temp: 24, condition: 'Sunny' },
      { day: 'Sun', temp: 25, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'South Sinai',
    temp: 26,
    condition: 'Sunny',
    humidity: 35,
    windSpeed: 18,
    risk: 'Low',
    advice: 'Excellent for drought-resistant crops. Monitor groundwater salinity.',
    adviceAr: 'ممتاز للمحاصيل المقاومة للجفاف. راقب ملوحة مياه الآبار.',
    forecast: [
      { day: 'Mon', temp: 26, condition: 'Sunny' },
      { day: 'Tue', temp: 28, condition: 'Sunny' },
      { day: 'Wed', temp: 29, condition: 'Sunny' },
      { day: 'Thu', temp: 27, condition: 'Partly Cloudy' },
      { day: 'Fri', temp: 26, condition: 'Sunny' },
      { day: 'Sat', temp: 27, condition: 'Sunny' },
      { day: 'Sun', temp: 29, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Red Sea',
    temp: 28,
    condition: 'Sunny',
    humidity: 30,
    windSpeed: 22,
    risk: 'Medium',
    advice: 'High evaporation rates. Keep desert crops hydrated.',
    adviceAr: 'معدلات تبخر عالية. حافظ على ري المحاصيل الصحراوية بانتظام.',
    forecast: [
      { day: 'Mon', temp: 28, condition: 'Sunny' },
      { day: 'Tue', temp: 30, condition: 'Sunny' },
      { day: 'Wed', temp: 31, condition: 'Sunny' },
      { day: 'Thu', temp: 29, condition: 'Sunny' },
      { day: 'Fri', temp: 28, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 29, condition: 'Sunny' },
      { day: 'Sun', temp: 31, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'New Valley',
    temp: 35,
    condition: 'Hot',
    humidity: 12,
    windSpeed: 15,
    risk: 'High',
    advice: 'Extremely dry air. Ensure efficient drip irrigation for date palms.',
    adviceAr: 'جفاف استثنائي. تأكد من كفاءة الري بالتنقيط لنخيل البلح والبرسيم الحجازي.',
    forecast: [
      { day: 'Mon', temp: 35, condition: 'Hot' },
      { day: 'Tue', temp: 37, condition: 'Hot' },
      { day: 'Wed', temp: 39, condition: 'Hot' },
      { day: 'Thu', temp: 36, condition: 'Sunny' },
      { day: 'Fri', temp: 34, condition: 'Sunny' },
      { day: 'Sat', temp: 35, condition: 'Sunny' },
      { day: 'Sun', temp: 37, condition: 'Sunny' },
    ]
  },
  {
    governorate: 'Matrouh',
    temp: 21,
    condition: 'Partly Cloudy',
    humidity: 75,
    windSpeed: 28,
    risk: 'Medium',
    advice: 'High coastal winds. Focus on rain-fed irrigation strategies.',
    adviceAr: 'رياح ساحلية قوية. ركز على استراتيجيات الزراعة المطرية وتخزين المياه.',
    forecast: [
      { day: 'Mon', temp: 21, condition: 'Partly Cloudy' },
      { day: 'Tue', temp: 22, condition: 'Cloudy' },
      { day: 'Wed', temp: 20, condition: 'Rain' },
      { day: 'Thu', temp: 19, condition: 'Rain' },
      { day: 'Fri', temp: 20, condition: 'Partly Cloudy' },
      { day: 'Sat', temp: 21, condition: 'Sunny' },
      { day: 'Sun', temp: 23, condition: 'Sunny' },
    ]
  },
];

const governoratesAr: Record<string, string> = {
  'Cairo': 'القاهرة',
  'Alexandria': 'الإسكندرية',
  'Minya': 'المنيا',
  'Sohag': 'سوهاج',
  'Giza': 'الجيزة',
  'Asyut': 'أسيوط',
  'Qena': 'قنا',
  'Luxor': 'الأقصر',
  'Aswan': 'أسوان',
  'Beheira': 'البحيرة',
  'Dakahlia': 'الدقهلية',
  'Gharbia': 'الغربية',
  'Kafr El Sheikh': 'كفر الشيخ',
  'Sharqia': 'الشرقية',
  'Monufia': 'المنوفية',
  'Qalyubia': 'القليوبية',
  'Faiyum': 'الفيوم',
  'Beni Suef': 'بني سويف',
  'Damietta': 'دمياط',
  'Ismailia': 'الإسماعيلية',
  'Suez': 'السويس',
  'Port Said': 'بورسعيد',
  'North Sinai': 'شمال سيناء',
  'South Sinai': 'جنوب سيناء',
  'Red Sea': 'البحر الأحمر',
  'New Valley': 'الوادي الجديد',
  'Matrouh': 'مطروح',
};

const conditionsAr: Record<string, string> = {
  'Sunny': 'مشمس',
  'Partly Cloudy': 'غائم جزئياً',
  'Cloudy': 'غائم',
  'Hot': 'حار',
  'Very Hot': 'حار جداً',
  'Rain': 'مطير',
};

const daysAr: Record<string, string> = {
  'Mon': 'الإثنين',
  'Tue': 'الثلاثاء',
  'Wed': 'الأربعاء',
  'Thu': 'الخميس',
  'Fri': 'الجمعة',
  'Sat': 'السبت',
  'Sun': 'الأحد',
};

const generateWeatherForDate = (date: Date, baseRegions: WeatherData[]): WeatherData[] => {
  const seed = date.getDate() + (date.getMonth() + 1) * 31 + (date.getFullYear() % 100) * 365;
  
  return baseRegions.map((reg, idx) => {
    // Generate a pseudo-random temp shift between -4 and +4 based on seed + idx
    const hash = Math.sin(seed + idx) * 10000;
    const tempShift = Math.floor((hash - Math.floor(hash)) * 9) - 4; // -4 to +4
    const humidityShift = Math.floor((hash * 10 - Math.floor(hash * 10)) * 21) - 10; // -10 to +10
    const windShift = Math.floor((hash * 100 - Math.floor(hash * 100)) * 9) - 4; // -4 to +4
    
    const newTemp = Math.max(15, Math.min(46, reg.temp + tempShift));
    const newHumidity = Math.max(10, Math.min(95, reg.humidity + humidityShift));
    const newWindSpeed = Math.max(5, Math.min(40, reg.windSpeed + windShift));
    
    // Choose weather condition based on temp
    let condition = reg.condition;
    if (newTemp >= 35) condition = 'Very Hot';
    else if (newTemp >= 30) condition = 'Hot';
    else if (newTemp < 20) condition = 'Cloudy';
    else if (newTemp < 18) condition = 'Rain';
    else {
      const condIndex = Math.floor((hash * 1000 - Math.floor(hash * 1000)) * 3);
      condition = condIndex === 0 ? 'Sunny' : condIndex === 1 ? 'Partly Cloudy' : reg.condition;
    }

    return {
      ...reg,
      temp: newTemp,
      condition,
      humidity: newHumidity,
      windSpeed: newWindSpeed,
      forecast: reg.forecast.map((f, fIdx) => {
        const fHash = Math.cos(seed + idx + fIdx) * 10000;
        const fShift = Math.floor((fHash - Math.floor(fHash)) * 7) - 3; // -3 to +3
        return {
          ...f,
          temp: Math.max(15, Math.min(46, f.temp + fShift))
        };
      })
    };
  });
};

export const AgriWeather: React.FC<AgriWeatherProps> = ({ lang, onAddContent, setActiveTab }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [regions, setRegions] = useState<WeatherData[]>(EGYPT_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<WeatherData>(EGYPT_REGIONS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("10:30 AM");
  
  // Date Picker states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());

  // Weather-to-Content AI state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);

  const handleGenerateWeatherPost = async () => {
    setIsAiGenerating(true);
    try {
      const govName = isRtl ? governoratesAr[selectedRegion.governorate] : selectedRegion.governorate;
      const condName = isRtl ? conditionsAr[selectedRegion.condition] : selectedRegion.condition;
      const adviceText = isRtl && selectedRegion.adviceAr ? selectedRegion.adviceAr : selectedRegion.advice;

      const post = await generateWeatherAlertPost({
        governorate: govName,
        condition: condName,
        temp: selectedRegion.temp,
        advice: adviceText,
        lang: lang
      });

      setGeneratedPost(post);
      showToast(
        isRtl ? 'تم توليد مسودة التنبيه بالذكاء الاصطناعي بنجاح!' : 'Advisory post drafted with Gemini AI!',
        'success'
      );
    } catch (err: any) {
      console.error('Weather AI error:', err);
      showToast(isRtl ? 'تعذر توليد المنشور. يرجى التحقق من مفتاح Gemini.' : 'AI generation failed', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handlePushToPrep = () => {
    if (!generatedPost || !onAddContent) return;

    onAddContent({
      title: generatedPost.title,
      caption: generatedPost.caption,
      description: `${generatedPost.description}\n\n${generatedPost.cta}\n\n${generatedPost.hashtags.join(' ')}`,
      platforms: ['Facebook', 'WhatsApp'],
      type: 'Post',
      status: 'Idea',
      approvalStatus: 'Pending',
      priority: selectedRegion.risk === 'High' ? 'High' : 'Normal',
      objective: 'Clinic',
      dueDate: new Date().toISOString().split('T')[0],
      assignedTo: [],
      createdBy: 'Weather Alert AI',
      week: 'Week 1',
      tasks: [
        { id: 'wt1', text: isRtl ? 'مراجعة التوصية الفنية من مهندس المحاصيل' : 'Review agronomist recommendation', completed: false },
        { id: 'wt2', text: isRtl ? 'نشر التنبيه على جروبات المزارعين' : 'Broadcast to farmers groups', completed: false }
      ],
      comments: [],
      attachments: []
    });

    setGeneratedPost(null);
    showToast(isRtl ? 'تمت إضافة التنبيه بنجاح إلى جدول التحضير!' : 'Alert added to Preparation Schedule!', 'success');
    if (setActiveTab) {
      setActiveTab('preparation');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
    setIsRefreshing(true);
    
    setTimeout(() => {
      const updatedList = generateWeatherForDate(date, EGYPT_REGIONS);
      setRegions(updatedList);
      
      const currentSelected = updatedList.find(r => r.governorate === selectedRegion.governorate);
      if (currentSelected) {
        setSelectedRegion(currentSelected);
      }
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 800);
  };

  const daysInMonth = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [calendarViewDate]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const refreshedList = generateWeatherForDate(selectedDate, EGYPT_REGIONS).map(reg => {
        const shift = Math.floor(Math.random() * 5) - 2;
        const newTemp = Math.max(15, Math.min(45, reg.temp + shift));
        const newHumidity = Math.max(10, Math.min(95, reg.humidity + (Math.floor(Math.random() * 11) - 5)));
        
        return {
          ...reg,
          temp: newTemp,
          humidity: newHumidity,
          forecast: reg.forecast.map(f => {
            const fShift = Math.floor(Math.random() * 5) - 2;
            return {
              ...f,
              temp: Math.max(15, Math.min(45, f.temp + fShift))
            };
          })
        };
      });
      
      setRegions(refreshedList);
      
      const currentSelected = refreshedList.find(r => r.governorate === selectedRegion.governorate);
      if (currentSelected) {
        setSelectedRegion(currentSelected);
      }
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
    }, 1000);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny':
      case 'Hot':
      case 'Very Hot':
        return <Sun className="text-amber-500" size={32} />;
      case 'Partly Cloudy':
        return <Cloud className="text-gray-400" size={32} />;
      case 'Cloudy':
        return <Cloud className="text-gray-500" size={32} />;
      case 'Rain':
        return <CloudRain className="text-blue-500" size={32} />;
      default:
        return <Sun className="text-amber-500" size={32} />;
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {isRtl ? 'الطقس الزراعي' : 'Agri Weather'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isRtl ? 'التوقعات والمخاطر الزراعية في محافظات مصر' : 'Forecasts and agricultural risks across Egypt'}
            {lastUpdated && <span className="text-xs text-green-600 block mt-1">✓ {isRtl ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 rounded-2xl text-xs font-black transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn("transition-all", isRefreshing && "animate-spin")} />
            {isRtl ? 'تحديث الآن' : 'Refresh Weather'}
          </button>
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-gray-150 shadow-sm cursor-pointer hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all relative z-20"
            >
              <Calendar size={18} className="text-green-600" />
              <span>
                {selectedDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </button>

            {isCalendarOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsCalendarOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white p-5 rounded-[2rem] border border-gray-150 shadow-2xl z-45 w-80 text-gray-800 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
                    <button 
                      type="button" 
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-gray-500"
                    >
                      <ChevronRight size={16} className={isRtl ? "" : "rotate-180"} />
                    </button>
                    <span className="text-xs font-black uppercase text-gray-950 tracking-wider">
                      {calendarViewDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      type="button" 
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-gray-500"
                    >
                      <ChevronRight size={16} className={isRtl ? "rotate-180" : ""} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {isRtl ? (
                      ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((d, idx) => <span key={idx} className="truncate">{d[0]}</span>)
                    ) : (
                      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <span key={idx}>{d}</span>)
                    )}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((day, idx) => {
                      if (day === null) {
                        return <div key={idx} />;
                      }
                      const dayDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
                      const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDateSelect(dayDate)}
                          className={cn(
                            "h-9 w-9 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center",
                            isSelected 
                              ? "bg-green-600 text-white shadow-lg shadow-green-100 scale-105"
                              : "hover:bg-green-50 text-gray-700 hover:text-green-800"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Regions Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
            {isRtl ? 'المحافظات' : 'Governorates'}
          </h2>
          <div className="space-y-2">
            {regions.map((region) => (
              <button
                key={region.governorate}
                onClick={() => setSelectedRegion(region)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                  selectedRegion.governorate === region.governorate
                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                    : "bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:bg-green-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} className={selectedRegion.governorate === region.governorate ? "text-white" : "text-gray-400 group-hover:text-green-500"} />
                  <span className="font-bold">{isRtl ? governoratesAr[region.governorate] : region.governorate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{region.temp}°C</span>
                  <ChevronRight size={16} className={cn("transition-transform", isRtl ? "rotate-180" : "")} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Region Detailed View */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            key={selectedRegion.governorate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-1">
                    {isRtl ? governoratesAr[selectedRegion.governorate] : selectedRegion.governorate}
                  </h2>
                  <p className="text-lg text-gray-500 font-medium italic">
                    {isRtl ? conditionsAr[selectedRegion.condition] : selectedRegion.condition}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-3xl">
                  {getWeatherIcon(selectedRegion.condition)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-3xl">
                  <Droplets className="text-blue-500 mb-2" size={24} />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{isRtl ? 'الرطوبة' : 'Humidity'}</p>
                  <p className="text-2xl font-black text-blue-900">{selectedRegion.humidity}%</p>
                </div>
                <div className="p-6 bg-amber-50 rounded-3xl">
                  <Thermometer className="text-amber-500 mb-2" size={24} />
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">{isRtl ? 'درجة الحرارة' : 'Temperature'}</p>
                  <p className="text-2xl font-black text-amber-900">{selectedRegion.temp}°C</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <Wind className="text-slate-500 mb-2" size={24} />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isRtl ? 'الرياح' : 'Wind'}</p>
                  <p className="text-2xl font-black text-slate-900">{selectedRegion.windSpeed} km/h</p>
                </div>
              </div>

              <div className={cn(
                "p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4",
                selectedRegion.risk === 'High' ? "bg-red-50 border-red-100" : 
                selectedRegion.risk === 'Medium' ? "bg-orange-50 border-orange-100" : 
                "bg-green-50 border-green-100"
              )}>
                <div className="flex items-start gap-4">
                  <AlertTriangle className={selectedRegion.risk === 'High' ? "text-red-500" : selectedRegion.risk === 'Medium' ? "text-orange-500" : "text-green-500"} size={24} />
                  <div>
                    <h3 className={cn(
                      "text-sm font-black uppercase tracking-wider mb-1",
                      selectedRegion.risk === 'High' ? "text-red-700" : selectedRegion.risk === 'Medium' ? "text-orange-700" : "text-green-700"
                    )}>
                      {isRtl ? 'تحليل المخاطر الزراعية' : 'Agricultural Risk Analysis'}: {isRtl ? (selectedRegion.risk === 'High' ? 'عالي' : selectedRegion.risk === 'Medium' ? 'متوسط' : 'منخفض') : selectedRegion.risk}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">
                      {isRtl && selectedRegion.adviceAr ? selectedRegion.adviceAr : selectedRegion.advice}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={handleGenerateWeatherPost}
                  className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs transition-all shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isRtl ? 'جاري التوليد...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{isRtl ? 'توليد منشور عاجل (Gemini)' : 'Draft Urgent Post (Gemini)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Generated Alert Post Modal */}
          <AnimatePresence>
            {generatedPost && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setGeneratedPost(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-900">{generatedPost.title}</h3>
                        <p className="text-xs font-bold text-gray-400">{isRtl ? 'مسودة منشور عاجل تم توليدها بالذكاء الاصطناعي' : 'AI generated urgent advisory draft'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setGeneratedPost(null)}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                      <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">{isRtl ? 'الافتتاحية / الكابشن:' : 'Caption:'}</p>
                      <p className="text-sm font-bold text-amber-950">{generatedPost.caption}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{isRtl ? 'نص المنشور الكامل:' : 'Full Post Body:'}</p>
                      {generatedPost.description}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {generatedPost.hashtags.map((tag, idx) => (
                        <span key={idx} className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        const copyText = `${generatedPost.caption}\n\n${generatedPost.description}\n\n${generatedPost.cta}\n\n${generatedPost.hashtags.join(' ')}`;
                        navigator.clipboard.writeText(copyText);
                        showToast(isRtl ? 'تم نسخ المنشور إلى الحافظة!' : 'Copied to clipboard!', 'info');
                      }}
                      className="px-6 py-3 rounded-2xl font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                    >
                      {isRtl ? 'نسخ النص' : 'Copy Text'}
                    </button>

                    {onAddContent && (
                      <button
                        type="button"
                        onClick={handlePushToPrep}
                        className="px-6 py-3 rounded-2xl font-black text-xs bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all"
                      >
                        {isRtl ? 'إرسال لجدول التحضير كفكرة محتوى' : 'Push to Preparation Board'}
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-green-600" />
              {isRtl ? 'توقعات الأسبوع القادم' : 'Forecast for Next Week'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {selectedRegion.forecast.map((f, i) => (
                <div key={i} className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{isRtl ? daysAr[f.day] : f.day}</span>
                  <div className="mb-3">
                    {getWeatherIcon(f.condition)}
                  </div>
                  <span className="text-lg font-black text-gray-900">{f.temp}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
