"use client";

import { useBookGuard } from "@/hooks/use-book-guard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Clock,
  Target,
  MapPin,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Artist } from "@/lib/smart-search";
import { ArtistPortfolio } from "@/components/artist-portfolio";
import { FavoriteButton } from "@/components/account/favorite-button";
import { mediaUrl, type ArtistPageContent } from "@/lib/artist-page-types";

interface ArtistProfileViewProps {
  artist: Artist;
  onNavigate?: () => void;
  heroAction?: ReactNode;
  content?: ArtistPageContent | null;
}

export function ArtistProfileView({
  artist,
  onNavigate,
  heroAction,
  content,
}: ArtistProfileViewProps) {
  const router = useRouter();
  const bookGuard = useBookGuard();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("about");

  const fullName = `${artist.name} ${artist.specialty.split(" ")[0]}`;

  const artistImage =
    (content?.bannerPath ? mediaUrl(content.bannerPath) : null) ||
    artist.image ||
    `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(artist.name)} ${encodeURIComponent(artist.category ?? artist.specialty)} performance`;
  const profileImage =
    (content?.avatarPath ? mediaUrl(content.avatarPath) : null) ||
    artist.image ||
    `/placeholder.svg?height=144&width=144&query=${encodeURIComponent(artist.name)} profile portrait`;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [2024, 2025, 2026, 2027];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 for Monday-first calendar
    return day === 0 ? 6 : day - 1;
  };

  const isDateAvailable = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return artist.availableDates?.includes(dateStr);
  };

  const isDateUnavailable = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return artist.unavailableDates?.includes(dateStr);
  };

  const isDateInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const unavailable = isDateUnavailable(day);
      const isSelected = selectedDate === day;
      const isPast = isDateInPast(day);

      let dayClasses =
        "aspect-square w-full text-sm rounded-md flex items-center justify-center transition-colors ";

      if (isPast) {
        dayClasses +=
          "bg-zinc-500 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 cursor-not-allowed line-through";
      } else if (unavailable) {
        dayClasses +=
          "bg-red-600 dark:bg-red-500 text-white font-medium cursor-not-allowed";
      } else if (isSelected) {
        dayClasses +=
          "bg-green-600 dark:bg-green-500 text-white font-medium ring-2 ring-green-400 dark:ring-green-300";
      } else {
        dayClasses +=
          "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer bg-zinc-200 dark:bg-zinc-700";
      }

      days.push(
        <button
          key={day}
          onClick={() =>
            !unavailable && !isPast && setSelectedDate(isSelected ? null : day)
          }
          disabled={unavailable || isPast}
          className={dayClasses}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "Select a Date";
    const date = new Date(currentYear, currentMonth, selectedDate);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null); // Reset selection when changing month
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null); // Reset selection when changing month
  };

  return (
    <div className="bg-background">
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-40 sm:h-56 md:h-64">
          <img
            src={artistImage || "/placeholder.svg"}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
          {heroAction}
        </div>

        {/* Profile Image */}
        <div className="absolute left-3 sm:left-6 top-[100px] sm:top-[152px] md:top-[176px] w-20 h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 sm:border-[6px] border-background bg-background z-30 overflow-hidden shadow-lg">
          <img
            src={profileImage || "/placeholder.svg"}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-3 sm:px-6 pb-4 sm:pb-6 pt-12 sm:pt-16 md:pt-20">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold mb-1 text-foreground">
            {artist.name}
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground mb-3">
            {content?.tagline || fullName}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-5 sm:h-5 ${
                    i < Math.floor(artist.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-sm sm:text-lg text-foreground">
              {artist.rating}
            </span>
            <a
              href="#"
              className="text-xs sm:text-base text-blue-600 dark:text-blue-400 hover:underline"
            >
              ({artist.reviews})
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <FavoriteButton professionalId={String(artist.id)} professionalType="artist" />
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-border text-foreground hover:bg-accent text-sm sm:text-base py-2 sm:py-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              className="bg-red-700 hover:bg-red-600 text-white flex-1 text-sm sm:text-base py-2 sm:py-auto"
              onClick={() => {
                const href = `/booking?artistId=${artist.id}&type=artist`;
                if (!bookGuard(href)) return;
                onNavigate?.();
                router.push(href);
              }}
            >
              Book Now
            </Button>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Per Hour Card */}
          <div className="border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-6 bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground mb-2">
              Per Hour
            </div>
            <div className="flex items-baseline gap-0.5 mb-1">
              <span className="text-2xl sm:text-4xl font-bold text-red-600">
                €
              </span>
              <span className="text-2xl sm:text-4xl font-bold text-foreground">
                {artist.price.replace("€", "").trim()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">excl.eq</div>
          </div>

          {/* Duration Card */}
          <div className="border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-6 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Duration
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              1-8h
            </div>
          </div>

          {/* Experience Card */}
          <div className="border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-6 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Exp
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              10y
            </div>
          </div>

          {/* Travel Radius Card */}
          <div className="border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-6 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Travel
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              10k
            </div>
            <div className="text-xs text-muted-foreground">km</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-0 mb-4 sm:mb-6 overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="about"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-3 sm:px-8 py-2 sm:py-3 font-medium text-xs sm:text-base whitespace-nowrap text-foreground"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-3 sm:px-8 py-2 sm:py-3 font-medium text-xs sm:text-base whitespace-nowrap text-foreground"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-3 sm:px-8 py-2 sm:py-3 font-medium text-xs sm:text-base whitespace-nowrap text-foreground"
            >
              Equipment
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:bg-muted px-3 sm:px-8 py-2 sm:py-3 font-medium text-xs sm:text-base whitespace-nowrap text-foreground"
            >
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
              About
            </h3>
            <p className="text-xs sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              {artist.description ||
                `Armin A.T is a passionate artist whose deep musical roots as a pianist and guitarist shape his dynamic DJ sets.`}
            </p>

            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-foreground">
                Event Types
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {(
                  artist.eventTypes || [
                    "Birthday Party",
                    "Wedding",
                    "Private Dinner",
                    "House Party",
                    "Graduation Party",
                  ]
                ).map((event) => (
                  <button
                    key={event}
                    className="px-2 sm:px-4 py-1 sm:py-2 border-2 border-foreground rounded-full text-xs font-medium hover:bg-accent transition-colors text-foreground"
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-foreground">
                Music Genres
              </h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {(
                  artist.musicStyles || [
                    "House",
                    "Techno",
                    "Deep House",
                    "Tech House",
                    "Trance",
                  ]
                ).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 sm:px-4 py-1 sm:py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs sm:text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-0">
            {content ? (
              <ArtistPortfolio content={content} artistName={artist.name} />
            ) : (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
                  Event Photos
                </h3>
                <p className="text-xs sm:text-base text-muted-foreground text-center py-6 sm:py-8">
                  No albums available.
                </p>
              </div>

              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
                  Videos
                </h3>
                <p className="text-xs sm:text-base text-muted-foreground text-center py-6 sm:py-8">
                  No videos available.
                </p>
              </div>

              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
                  Connect
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <div className="border-2 border-border rounded-lg p-3 sm:p-6 flex items-center gap-2 sm:gap-3 hover:border-muted-foreground transition-colors cursor-pointer bg-card">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-red-600 flex-shrink-0"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-base text-foreground">
                      YouTube
                    </span>
                  </div>
                  <div className="border-2 border-border rounded-lg p-3 sm:p-6 flex items-center gap-2 sm:gap-3 hover:border-muted-foreground transition-colors cursor-pointer bg-card">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-green-600 flex-shrink-0"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.609 12.102 1.35.206.121.274.387.153.593-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-base text-foreground">
                      Spotify
                    </span>
                  </div>
                  <div className="border-2 border-border rounded-lg p-3 sm:p-6 flex items-center gap-2 sm:gap-3 hover:border-muted-foreground transition-colors cursor-pointer bg-card">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-orange-600 flex-shrink-0"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.949 17.847c-2.936-1.739-6.604-2.125-10.946-1.166-.238.052-.467-.106-.519-.344-.052-.238.106-.467.344-.519 4.765-1.052 8.845-.609 12.102 1.35.206.121.274.387.153.593-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-base text-foreground">
                      SoundCloud
                    </span>
                  </div>
                  <div className="border-2 border-border rounded-lg p-3 sm:p-6 flex items-center gap-2 sm:gap-3 hover:border-muted-foreground transition-colors cursor-pointer bg-card">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-red-600 flex-shrink-0"
                    >
                      <path d="M18.715 4.365c-1.264 0-2.438.344-3.449.943C13.903 2.153 10.726 0 7.015 0 3.14 0 0 3.141 0 7.016c0 3.874 3.14 7.015 7.015 7.015.17 0 .339-.006.507-.018v9.982h11.193c2.873 0 5.201-2.329 5.201-5.201V9.566c0-2.873-2.328-5.201-5.201-5.201z" />
                    </svg>
                    <span className="font-medium text-xs sm:text-base text-foreground">
                      Deezer
                    </span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="equipment" className="mt-0">
            <h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">
              Equipment Options
            </h3>

            <div className="bg-card border-2 border-border rounded-lg sm:rounded-xl p-3 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 7h-9M14 17H5M15 3v18M9 3v18" />
                  </svg>
                  <h4 className="text-base sm:text-xl font-bold text-foreground">
                    Basic DJ Package
                  </h4>
                </div>
                <div className="bg-card border-2 border-border rounded-full px-3 py-1 sm:px-4 sm:py-1">
                  <span className="font-bold text-xs sm:text-base text-foreground">
                    {artist.equipmentPrice
                      ? `${artist.equipmentPrice.replace("€", "€ ")}/hour`
                      : "€450/day"}
                  </span>
                </div>
              </div>

              <p className="font-semibold mb-2 sm:mb-3 text-xs sm:text-base text-foreground">
                Complete Setup
              </p>
              <p className="text-xs sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Everything for professional DJ setup.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                {/* Row 1 */}
                <div className="flex gap-3">
                  <img
                    src="/pioneer-cdj-2000-dj-player.jpg"
                    alt="Pioneer CDJ-2000"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      2x Pioneer CDJ-2000 Players
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Professional-grade media players
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <img
                    src="/djm-900nxs2-mixer.jpg"
                    alt="DJM-900NXS2"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      DJM-900NXS2 Mixer
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Industry standard 4-channel mixer
                    </p>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex gap-3">
                  <img
                    src="/dj-table-with-cover.jpg"
                    alt="DJ Table"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      DJ Table with Cover
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Professional setup with cable management
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <img
                    src="/shure-sm58-microphone.jpg"
                    alt="Shure SM58"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      Shure SM58 Microphone
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Professional vocal microphone with stand
                    </p>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex gap-3">
                  <img
                    src="/qsc-k12-2-speakers.jpg"
                    alt="QSC K12.2"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      2x QSC K12.2 Speakers
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Powerful 2000W speakers with stands
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <img
                    src="/dj-lighting-package.jpg"
                    alt="Lighting"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h5 className="font-semibold text-foreground">
                      Basic Lighting Package
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      2 moving heads, 2 par cans, and controller
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-foreground">
              Extra Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {/* Extra Option 1 */}
              <div className="border-2 border-border rounded-lg sm:rounded-xl p-4 sm:p-6 bg-card">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <h5 className="font-semibold text-sm sm:text-base text-foreground">
                    Pioneer CDJ-3000
                  </h5>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Upgrade to latest players
                </p>
                <div className="text-base sm:text-lg font-bold text-red-600">
                  +€150/day
                </div>
              </div>

              {/* Extra Option 2 */}
              <div className="border-2 border-border rounded-lg sm:rounded-xl p-4 sm:p-6 bg-card">
                <h5 className="font-semibold text-sm sm:text-base text-foreground mb-2">
                  Extra Subwoofer
                </h5>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Add powerful bass
                </p>
                <div className="text-base sm:text-lg font-bold text-red-600">
                  +€100/day
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">
              Availability Calendar
            </h3>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 p-2 sm:p-3 bg-card border border-border rounded-lg w-fit">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-green-600 bg-green-600"></div>
                <span className="text-xs sm:text-sm text-foreground">
                  Selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-red-600 bg-red-600"></div>
                <span className="text-xs sm:text-sm text-foreground">
                  Unavailable
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-zinc-500 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-zinc-300 dark:text-zinc-500 text-xs line-through">
                    31
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Past
                </span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                {/* Right Column - Calendar */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 sm:p-2 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-sm sm:text-lg font-semibold text-foreground">
                      {months[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={goToNextMonth}
                      className="p-1 sm:p-2 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <div
                        key={index}
                        className="text-center text-xs font-semibold text-muted-foreground h-8 flex items-center justify-center"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>

                  <Link
                    href={
                      selectedDate
                        ? `/booking?artistId=${artist.id}&date=${selectedDate}-${currentMonth + 1}-${currentYear}`
                        : "#"
                    }
                    className={`block w-full mt-3 sm:mt-4 py-2 sm:py-3 rounded-lg font-medium text-sm text-center transition-colors ${
                      selectedDate
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-secondary text-muted-foreground cursor-not-allowed pointer-events-none"
                    }`}
                    onClick={(e) => {
                      if (!selectedDate) {
                        e.preventDefault();
                      } else if (
                        bookGuard(
                          `/booking?artistId=${artist.id}&date=${selectedDate}-${currentMonth + 1}-${currentYear}`,
                          e,
                        )
                      ) {
                        onNavigate?.();
                      }
                    }}
                  >
                    {selectedDate ? "Book Now" : "Select a Date"}
                  </Link>
                </div>

                {/* Left Column - Upcoming Bookings */}
                <div>
                  <h3 className="text-base sm:text-xl font-semibold text-red-600 mb-3 sm:mb-4">
                    Upcoming Bookings
                  </h3>
                  <div className="space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Private Party
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        Dec 21, 2025
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500" />
                        Eindhoven
                      </div>
                    </div>

                    <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Private Party
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        Dec 31, 2025
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500" />
                        Zwolle
                      </div>
                    </div>

                    <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Private Wedding
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        May 8, 2026
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500" />
                        Baarn
                      </div>
                    </div>

                    <div className="border-l-4 border-red-500 bg-muted rounded-r-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Private Wedding
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        May 9, 2026
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500" />
                        Amsterdam
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
