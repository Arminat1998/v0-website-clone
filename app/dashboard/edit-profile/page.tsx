"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Plus, X } from "lucide-react"
import { DualRangeSlider } from "@/components/dual-range-slider"
import { useState, useRef } from "react"
import { useLanguage } from "@/contexts/language-context"

interface PackageEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
}

interface ExtraEquipmentItem {
  id: string
  name: string
  price: string
  description: string
  image?: string
}

export default function EditProfilePage() {
  const { t } = useLanguage()
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(8)
  const [artistType, setArtistType] = useState<string>("")

  const [packageEquipment, setPackageEquipment] = useState<PackageEquipmentItem[]>([])
  const [packageEquipmentName, setPackageEquipmentName] = useState<string>("")
  const [packageEquipmentDescription, setPackageEquipmentDescription] = useState<string>("")
  const [packagePrice, setPackagePrice] = useState<string>("")
  const [packageEquipmentImage, setPackageEquipmentImage] = useState<string>("")
  const packageFileInputRef = useRef<HTMLInputElement>(null)

  const [extraEquipment, setExtraEquipment] = useState<ExtraEquipmentItem[]>([])
  const [currentExtraEquipment, setCurrentExtraEquipment] = useState<ExtraEquipmentItem>({
    id: "",
    name: "",
    price: "",
    description: "",
  })
  const [currentExtraEquipmentImage, setCurrentExtraEquipmentImage] = useState<string>("")
  const extraFileInputRef = useRef<HTMLInputElement>(null)

  const handlePackageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPackageEquipmentImage(file.name)
      console.log("[v0] Package equipment file selected:", file.name)
    }
  }

  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCurrentExtraEquipmentImage(file.name)
      console.log("[v0] Extra equipment file selected:", file.name)
    }
  }

  const addPackageEquipment = () => {
    console.log("[v0] Add Package Equipment clicked")
    console.log("[v0] Package equipment name:", packageEquipmentName)
    console.log("[v0] Package price:", packagePrice)

    if (packageEquipmentName && packagePrice) {
      const newItem: PackageEquipmentItem = {
        id: Date.now().toString(),
        name: packageEquipmentName,
        price: packagePrice,
        description: packageEquipmentDescription,
        image: packageEquipmentImage,
      }
      setPackageEquipment([...packageEquipment, newItem])
      console.log("[v0] Package equipment added successfully:", newItem)
      console.log("[v0] Total package equipment items:", packageEquipment.length + 1)

      setPackageEquipmentName("")
      setPackagePrice("")
      setPackageEquipmentDescription("")
      setPackageEquipmentImage("")
      if (packageFileInputRef.current) {
        packageFileInputRef.current.value = ""
      }
    } else {
      console.log("[v0] Cannot add package equipment - missing required fields")
      alert("Please fill in Equipment Name and Package Price before adding")
    }
  }

  const removePackageEquipment = (id: string) => {
    setPackageEquipment(packageEquipment.filter((item) => item.id !== id))
  }

  const addExtraEquipment = () => {
    console.log("[v0] Add Extra Equipment clicked")
    console.log("[v0] Extra equipment name:", currentExtraEquipment.name)
    console.log("[v0] Extra equipment price:", currentExtraEquipment.price)

    if (currentExtraEquipment.name && currentExtraEquipment.price) {
      const newItem = { ...currentExtraEquipment, id: Date.now().toString(), image: currentExtraEquipmentImage }
      setExtraEquipment([...extraEquipment, newItem])
      console.log("[v0] Extra equipment added successfully:", newItem)
      console.log("[v0] Total extra equipment items:", extraEquipment.length + 1)

      setCurrentExtraEquipment({ id: "", name: "", price: "", description: "" })
      setCurrentExtraEquipmentImage("")
      if (extraFileInputRef.current) {
        extraFileInputRef.current.value = ""
      }
    } else {
      console.log("[v0] Cannot add extra equipment - missing required fields")
      alert("Please fill in Equipment Name and Rental Price before adding")
    }
  }

  const removeExtraEquipment = (id: string) => {
    setExtraEquipment(extraEquipment.filter((item) => item.id !== id))
  }

  const getMinimumEquipmentRequirements = () => {
    const requirements: Record<string, string[]> = {
      DJ: [
        "Professional DJ controller (Pioneer XDJ-RX2 or higher) with DJ table",
        "Sound system on stands (at least 2 speakers for 300+ people)",
        "Professional microphone",
        "Full lighting setup (minimum one party light bar)",
      ],
      Saxophonist: [
        "Professional saxophone (Alto or Tenor)",
        "Wireless microphone system",
        "Portable PA system with stands",
        "Music stand and sheet music collection",
      ],
      Band: [
        "Full PA system with mixing console",
        "Multiple microphones (vocal and instrument)",
        "Instrument amplifiers",
        "Monitor system for band members",
      ],
      Singer: [
        "Professional vocal microphone",
        "Wireless microphone system",
        "In-ear monitors or stage monitors",
        "Portable PA system",
      ],
      Pianist: ["Digital piano or keyboard (88 keys)", "Piano bench", "Keyboard amplifier or PA system", "Music stand"],
      Guitarist: [
        "Professional guitar (acoustic or electric)",
        "Guitar amplifier",
        "Effects pedals and pedalboard",
        "Wireless system",
      ],
      Violinist: ["Professional violin", "Bow and rosin", "Pickup/microphone system", "Portable amplifier"],
    }
    return requirements[artistType] || requirements.DJ
  }

  const getPackageDescription = () => {
    const descriptions: Record<string, string> = {
      DJ: "Add your DJ equipment package for full-day rental. Include all essential gear like controllers, speakers, lighting, and microphones. This will be shown as one complete package with a total price.",
      Saxophonist:
        "Add your saxophone performance package including your instrument, sound system, and accessories. All items will be grouped into one package with a total price.",
      Band: "Add your band's complete equipment package including PA system, instruments, and all necessary gear for a full performance. All items will be grouped into one package.",
      Singer:
        "Add your vocal performance package including microphones, monitors, and sound equipment. All items will be grouped into one package with a total price.",
      Pianist:
        "Add your piano performance package including keyboard/piano, amplification, and accessories. All items will be grouped into one package with a total price.",
      Guitarist:
        "Add your guitar performance package including instrument, amplifier, effects, and accessories. All items will be grouped into one package with a total price.",
      Violinist:
        "Add your violin performance package including instrument, amplification system, and accessories. All items will be grouped into one package with a total price.",
    }
    return (
      descriptions[artistType] ||
      "Add the equipment you offer for full-day rental, including a name, price, and image. All items will be grouped into one package with a total price shown in your profile under the 'Package' section."
    )
  }

  const getEquipmentNamePlaceholder = () => {
    const placeholders: Record<string, string> = {
      DJ: "e.g. Pioneer CDJ-3000 + Mixer",
      Saxophonist: "e.g. Yamaha Alto Saxophone YAS-62",
      Band: "e.g. Full PA System with Mixer",
      Singer: "e.g. Shure SM58 Wireless System",
      Pianist: "e.g. Yamaha P-125 Digital Piano",
      Guitarist: "e.g. Fender Stratocaster + Amplifier",
      Violinist: "e.g. Professional Violin with Pickup",
    }
    return placeholders[artistType] || "e.g. Equipment name"
  }

  const inputClassName =
    "h-10 sm:h-12 w-full rounded-md border border-border bg-card px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  const textareaClassName =
    "w-full resize-none rounded-md border border-border bg-card px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <DashboardLayout>
      <div className="bg-background p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-500 flex-shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.editYourProfile}</h1>
          </div>

          {/* Profile Form */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stage Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="stageName" className="text-sm sm:text-base font-medium text-foreground">
                {t.stageName}
              </Label>
              <Input id="stageName" placeholder="DJ Naam" className={inputClassName} />
            </div>

            {/* Artist Type */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="artistType" className="text-sm sm:text-base font-medium text-foreground">
                {t.artistType}
              </Label>
              <Select value={artistType} onValueChange={setArtistType}>
                <SelectTrigger className="h-10 sm:h-12 w-full rounded-md border border-border bg-card text-foreground px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base">
                  <SelectValue placeholder="Select your artist type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DJ">DJ</SelectItem>
                  <SelectItem value="Saxophonist">Saxophonist</SelectItem>
                  <SelectItem value="Band">Band</SelectItem>
                  <SelectItem value="Singer">Singer</SelectItem>
                  <SelectItem value="Pianist">Pianist</SelectItem>
                  <SelectItem value="Guitarist">Guitarist</SelectItem>
                  <SelectItem value="Violinist">Violinist</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This helps clients find you based on the type of performance you offer
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-base font-medium text-gray-900 dark:text-white">
                {t.fullName}
              </Label>
              <Input id="fullName" placeholder="Jouw naam" className={inputClassName} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-white">
                {t.email}
              </Label>
              <Input id="email" type="email" className={inputClassName} />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium text-gray-900 dark:text-white">
                {t.phoneNumber}
              </Label>
              <Input id="phone" type="tel" className={inputClassName} />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium text-gray-900 dark:text-white">
                {t.bio}
              </Label>
              <Textarea id="bio" placeholder="Vertel iets over jezelf" rows={5} className={textareaClassName} />
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-base font-medium text-gray-900 dark:text-white">
                Years of Experience
              </Label>
              <Input id="experience" type="number" defaultValue="5" className={inputClassName} />
            </div>

            {/* Fee per hour */}
            <div className="space-y-2">
              <Label htmlFor="fee" className="text-base font-medium text-gray-900 dark:text-white">
                Fee (€ per hour)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                <Input
                  id="fee"
                  type="number"
                  defaultValue="100"
                  className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 pl-8 pr-4 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Minimum and Maximum Booking Hours */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="minHours" className="text-sm sm:text-base font-medium text-foreground">
                  Minimum Booking Hours
                </Label>
                <Input
                  id="minHours"
                  type="number"
                  value={minHours}
                  onChange={(e) => setMinHours(Number(e.target.value))}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="maxHours" className="text-sm sm:text-base font-medium text-foreground">
                  Maximum Booking Hours
                </Label>
                <Input
                  id="maxHours"
                  type="number"
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="py-4">
              <DualRangeSlider
                min={1}
                max={8}
                minValue={minHours}
                maxValue={maxHours}
                onMinChange={setMinHours}
                onMaxChange={setMaxHours}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-base font-medium text-gray-900 dark:text-white">
                City
              </Label>
              <Input id="city" placeholder="Amsterdam" defaultValue="Amsterdam" className={inputClassName} />
            </div>

            {/* Range (km) */}
            <div className="space-y-2">
              <Label htmlFor="range" className="text-base font-medium text-gray-900 dark:text-white">
                Range (km)
              </Label>
              <Input id="range" type="number" defaultValue="100" className={inputClassName} />
            </div>

            {/* Music Genres */}
            <div className="space-y-2">
              <Label htmlFor="genres" className="text-base font-medium text-gray-900 dark:text-white">
                Music Genres
              </Label>
              <Select>
                <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-base">
                  <SelectValue placeholder="Select music genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="hiphop">Hip Hop</SelectItem>
                  <SelectItem value="rnb">R&B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Types */}
            <div className="space-y-2">
              <Label htmlFor="eventTypes" className="text-base font-medium text-gray-900 dark:text-white">
                Event Types
              </Label>
              <Select>
                <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-base">
                  <SelectValue placeholder="Select event types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Package Equipment Rental */}
            {artistType && (
              <div className="space-y-3 sm:space-y-4 rounded-lg border-2 border-border bg-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Package Equipment Rental</h2>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{getPackageDescription()}</p>

                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Minimum equipment required to register:</h3>
                  <ul className="list-disc space-y-1 sm:space-y-1.5 pl-4 sm:pl-5 text-xs sm:text-sm md:text-base leading-relaxed text-foreground">
                    {getMinimumEquipmentRequirements().map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                  <p className="text-xs sm:text-sm md:text-base font-medium leading-relaxed text-red-500">
                    All equipment and its condition will be verified before your profile goes live on My Event Hub
                    platform.
                  </p>
                </div>

                {packageEquipment.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {packageEquipment.map((item) => (
                      <div key={item.id} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                              <span className="font-bold text-gray-900 dark:text-white">€{item.price}/day</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            {item.image && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Image: {item.image}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePackageEquipment(item.id)}
                            className="ml-3 h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="packageEquipmentName" className="text-base font-medium text-gray-900 dark:text-white">
                        Equipment Name
                      </Label>
                      <Input
                        id="packageEquipmentName"
                        placeholder={getEquipmentNamePlaceholder()}
                        value={packageEquipmentName}
                        onChange={(e) => setPackageEquipmentName(e.target.value)}
                        className={inputClassName}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packagePrice" className="text-base font-medium text-gray-900 dark:text-white">
                        Package Price (€ per day)
                      </Label>
                      <Input
                        id="packagePrice"
                        placeholder="e.g. 500"
                        value={packagePrice}
                        onChange={(e) => setPackagePrice(e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packageEquipmentDesc" className="text-base font-medium text-gray-900 dark:text-white">
                      Equipment Description
                    </Label>
                    <Textarea
                      id="packageEquipmentDesc"
                      placeholder="Details, condition, etc."
                      value={packageEquipmentDescription}
                      onChange={(e) => setPackageEquipmentDescription(e.target.value)}
                      className={textareaClassName}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium text-gray-900 dark:text-white">Equipment Image</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={packageFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePackageFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => packageFileInputRef.current?.click()}
                        className="h-10 border-gray-300 bg-white text-red-600 hover:bg-gray-50 hover:text-red-600"
                      >
                        Bestand kiezen
                      </Button>
                      <span className="text-sm text-gray-500">{packageEquipmentImage || "Geen bestand gekozen"}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPackageEquipment}
                  className="h-10 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
            )}

            {/* Extra Equipment Rental */}
            {artistType && (
              <div className="space-y-4 rounded-lg border-2 border-gray-300 bg-white p-6">
                <h2 className="text-2xl font-bold">Extra Equipment Rental</h2>
                <p className="text-base leading-relaxed text-gray-600">
                  Add extra equipment that can be rented separately, but only when your services are booked. These items
                  will appear in the "Extra Equipment" section on your profile.
                </p>

                {extraEquipment.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {extraEquipment.map((item) => (
                      <div key={item.id} className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-semibold">{item.name}</h4>
                              <span className="font-bold text-gray-900">€{item.price}/day</span>
                            </div>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExtraEquipment(item.id)}
                            className="ml-3 h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="equipmentName" className="text-base font-medium text-gray-900 dark:text-white">
                        Equipment Name
                      </Label>
                      <Input
                        id="equipmentName"
                        placeholder="e.g. Pioneer CDJ-3000"
                        value={currentExtraEquipment.name}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, name: e.target.value })}
                        className={inputClassName}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rentalPrice" className="text-base font-medium text-gray-900 dark:text-white">
                        Rental Price (€ per day)
                      </Label>
                      <Input
                        id="rentalPrice"
                        placeholder="e.g. 100"
                        value={currentExtraEquipment.price}
                        onChange={(e) => setCurrentExtraEquipment({ ...currentExtraEquipment, price: e.target.value })}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipmentDesc" className="text-base font-medium text-gray-900 dark:text-white">
                      Equipment Description
                    </Label>
                    <Textarea
                      id="equipmentDesc"
                      placeholder="Details, condition, etc."
                      value={currentExtraEquipment.description}
                      onChange={(e) =>
                        setCurrentExtraEquipment({ ...currentExtraEquipment, description: e.target.value })
                      }
                      className={textareaClassName}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium text-gray-900 dark:text-white">Equipment Image</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={extraFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleExtraFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => extraFileInputRef.current?.click()}
                        className="h-10 border-gray-300 bg-white text-red-600 hover:bg-gray-50 hover:text-red-600"
                      >
                        Bestand kiezen
                      </Button>
                      <span className="text-sm text-gray-500">
                        {currentExtraEquipmentImage || "Geen bestand gekozen"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExtraEquipment}
                  className="h-10 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
            )}

            {/* Social Media Accounts */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Social Media Accounts</h2>

              <div className="space-y-3 rounded-lg border-2 border-gray-300 bg-white p-4">
                <Select>
                  <SelectTrigger className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-base">
                    <SelectValue placeholder="Selecteer platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>

                <Input placeholder="Plak hier de link..." className={inputClassName} />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Voeg social media toe
              </Button>
            </div>

            {/* Save Button */}
            <Button className="h-12 w-full bg-blue-500 text-base font-semibold text-white hover:bg-blue-600">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
