/* ===== Language flags, Google Fonts cfg, font loading, font picker UI ===== */
/* auto-split from app.js lines 722–2553 */
// Languages that use right-to-left script
const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur", "yi", "dv"]);

/** Returns true if the given language code is RTL */
function isRtlLanguage(lang) {
  if (!lang) return false;
  return RTL_LANGUAGES.has(lang) || RTL_LANGUAGES.has(lang.split("-")[0]);
}

/** Returns true if the text contains RTL characters (Arabic, Hebrew, Persian, etc.) */
function hasRtlChars(text) {
  if (!text) return false;
  return /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(
    text,
  );
}

// Language flags mapping
const languageFlags = {
  en: "🇺🇸",
  "en-gb": "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  it: "🇮🇹",
  pt: "🇵🇹",
  "pt-br": "🇧🇷",
  nl: "🇳🇱",
  ru: "🇷🇺",
  ja: "🇯🇵",
  ko: "🇰🇷",
  zh: "🇨🇳",
  "zh-tw": "🇹🇼",
  ar: "🇸🇦",
  hi: "🇮🇳",
  tr: "🇹🇷",
  pl: "🇵🇱",
  sv: "🇸🇪",
  da: "🇩🇰",
  no: "🇳🇴",
  fi: "🇫🇮",
  th: "🇹🇭",
  vi: "🇻🇳",
  id: "🇮🇩",
  uk: "🇺🇦",
};

// Google Fonts configuration
const googleFonts = {
  loaded: new Set(),
  loading: new Set(),
  custom: [], // Uploaded custom fonts: { name, value }
  // Popular fonts that are commonly used for marketing/app store
  popular: [
    "Inter",
    "Poppins",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Lato",
    "Raleway",
    "Nunito",
    "Playfair Display",
    "Oswald",
    "Merriweather",
    "Source Sans Pro",
    "PT Sans",
    "Ubuntu",
    "Rubik",
    "Work Sans",
    "Quicksand",
    "Mulish",
    "Barlow",
    "DM Sans",
    "Manrope",
    "Space Grotesk",
    "Plus Jakarta Sans",
    "Outfit",
    "Sora",
    "Lexend",
    "Figtree",
    "Albert Sans",
    "Urbanist",
    "Satoshi",
    "General Sans",
    "Bebas Neue",
    "Anton",
    "Archivo",
    "Bitter",
    "Cabin",
    "Crimson Text",
    "Dancing Script",
    "Fira Sans",
    "Heebo",
    "IBM Plex Sans",
    "Josefin Sans",
    "Karla",
    "Libre Franklin",
    "Lora",
    "Noto Sans",
    "Nunito Sans",
    "Pacifico",
    "Permanent Marker",
    "Roboto Condensed",
    "Roboto Mono",
    "Roboto Slab",
    "Shadows Into Light",
    "Signika",
    "Slabo 27px",
    "Source Code Pro",
    "Titillium Web",
    "Varela Round",
    "Zilla Slab",
    "Arimo",
    "Barlow Condensed",
    "Catamaran",
    "Comfortaa",
    "Cormorant Garamond",
    "Dosis",
    "EB Garamond",
    "Exo 2",
    "Fira Code",
    "Hind",
    "Inconsolata",
    "Indie Flower",
    "Jost",
    "Kanit",
    "Libre Baskerville",
    "Maven Pro",
    "Mukta",
    "Nanum Gothic",
    "Noticia Text",
    "Oxygen",
    "Philosopher",
    "Play",
    "Prompt",
    "Rajdhani",
    "Red Hat Display",
    "Righteous",
    "Saira",
    "Sen",
    "Spectral",
    "Teko",
    "Vollkorn",
    "Yanone Kaffeesatz",
    "Zeyada",
    "Amatic SC",
    "Archivo Black",
    "Asap",
    "Assistant",
    "Bangers",
    "BioRhyme",
    "Cairo",
    "Cardo",
    "Chivo",
    "Concert One",
    "Cormorant",
    "Cousine",
    "DM Serif Display",
    "DM Serif Text",
    "Dela Gothic One",
    "El Messiri",
    "Encode Sans",
    "Eczar",
    "Fahkwang",
    "Gelasio",
  ],
  // System fonts that don't need loading
  system: [
    {
      name: "SF Pro Display",
      value: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    },
    { name: "SF Pro Rounded", value: "'SF Pro Rounded', -apple-system" },
    { name: "Helvetica Neue", value: "'Helvetica Neue', Helvetica" },
    { name: "Avenir Next", value: "'Avenir Next', Avenir" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Times New Roman", value: "'Times New Roman', serif" },
    { name: "Courier New", value: "'Courier New', monospace" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  ],
  // Cache for all Google Fonts (loaded on demand)
  allFonts: null,
};

// Load a Google Font dynamically
async function loadGoogleFont(fontName) {
  // Check if it's a system font
  const isSystem = googleFonts.system.some((f) => f.name === fontName);
  if (isSystem) return;

  // Check if it's a custom uploaded font (already loaded via FontFace API)
  const isCustom = googleFonts.custom.some((f) => f.name === fontName);
  if (isCustom) return;

  // If already loaded, just ensure the current weight is available
  if (googleFonts.loaded.has(fontName)) {
    const text = getTextSettings();
    const weight = text.headlineWeight || "600";
    try {
      await document.fonts.load(`${weight} 16px "${fontName}"`);
    } catch (e) {
      // Font already loaded, weight might not exist but that's ok
    }
    return;
  }

  // If currently loading, wait for it
  if (googleFonts.loading.has(fontName)) {
    // Wait a bit and check again
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (googleFonts.loading.has(fontName)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return;
  }

  googleFonts.loading.add(fontName);

  try {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
    link.rel = "stylesheet";

    // Wait for stylesheet to load first
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });

    // Wait for the font to actually load with the required weights
    const text = getTextSettings();
    const headlineWeight = text.headlineWeight || "600";
    const subheadlineWeight = text.subheadlineWeight || "400";

    // Load all weights we might need
    await Promise.all([
      document.fonts.load(`400 16px "${fontName}"`),
      document.fonts.load(`${headlineWeight} 16px "${fontName}"`),
      document.fonts.load(`${subheadlineWeight} 16px "${fontName}"`),
    ]);

    googleFonts.loaded.add(fontName);
    googleFonts.loading.delete(fontName);
  } catch (error) {
    console.warn(`Failed to load font: ${fontName}`, error);
    googleFonts.loading.delete(fontName);
  }
}

// Fetch all Google Fonts from the API (cached)
async function fetchAllGoogleFonts() {
  if (googleFonts.allFonts) {
    return googleFonts.allFonts;
  }

  try {
    // Try to fetch from Google Fonts API v2
    // API key is optional - the API works without it but has lower rate limits
    const apiKey = state.settings?.googleFontsApiKey || "";
    const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
    url.searchParams.set("sort", "popularity");
    if (apiKey) {
      url.searchParams.set("key", apiKey);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          // Extract font family names from API response
          googleFonts.allFonts = data.items.map((font) => font.family);
          console.log(
            `Loaded ${googleFonts.allFonts.length} fonts from Google Fonts API`,
          );
          return googleFonts.allFonts;
        }
      } else if (response.status === 429) {
        console.warn(
          "Google Fonts API rate limit reached, using fallback font list",
        );
      } else {
        console.warn(
          `Google Fonts API returned status ${response.status}, using fallback font list`,
        );
      }
    } catch (apiError) {
      console.warn(
        "Failed to fetch from Google Fonts API, using fallback font list:",
        apiError,
      );
    }

    // Fallback to curated list of 1000+ popular fonts
    // This list covers the most commonly used fonts on Google Fonts
    googleFonts.allFonts = [
      ...googleFonts.popular,
      "ABeeZee",
      "Abel",
      "Abhaya Libre",
      "Abril Fatface",
      "Aclonica",
      "Acme",
      "Actor",
      "Adamina",
      "Advent Pro",
      "Aguafina Script",
      "Akronim",
      "Aladin",
      "Aldrich",
      "Alef",
      "Alegreya",
      "Alegreya Sans",
      "Alegreya Sans SC",
      "Alex Brush",
      "Alfa Slab One",
      "Alice",
      "Alike",
      "Alike Angular",
      "Allan",
      "Allerta",
      "Allison",
      "Allura",
      "Almendra",
      "Amaranth",
      "Amatic SC",
      "Amethysta",
      "Amiko",
      "Amiri",
      "Amita",
      "Anaheim",
      "Andada",
      "Andika",
      "Angkor",
      "Annie Use Your Telescope",
      "Anonymous Pro",
      "Antic",
      "Antic Didone",
      "Antonio",
      "Arapey",
      "Arbutus",
      "Arbutus Slab",
      "Architects Daughter",
      "Archivo Narrow",
      "Aref Ruqaa",
      "Arima Madurai",
      "Arvo",
      "Asap Condensed",
      "Asar",
      "Asset",
      "Astloch",
      "Asul",
      "Athiti",
      "Atkinson Hyperlegible",
      "Atomic Age",
      "Aubrey",
      "Audiowide",
      "Autour One",
      "Average",
      "Average Sans",
      "Averia Gruesa Libre",
      "Averia Libre",
      "Averia Sans Libre",
      "Averia Serif Libre",
      "B612",
      "B612 Mono",
      "Bad Script",
      "Bahiana",
      "Bahianita",
      "Bai Jamjuree",
      "Baloo",
      "Baloo 2",
      "Balsamiq Sans",
      "Balthazar",
      "Baskervville",
      "Battambang",
      "Baumans",
      "Bellefair",
      "Belleza",
      "Bellota",
      "Bellota Text",
      "BenchNine",
      "Bentham",
      "Berkshire Swash",
      "Beth Ellen",
      "Bevan",
      "Big Shoulders Display",
      "Big Shoulders Text",
      "Bigelow Rules",
      "Bigshot One",
      "Bilbo",
      "Bilbo Swash Caps",
      "Blinker",
      "Bodoni Moda",
      "Bokor",
      "Bonbon",
      "Boogaloo",
      "Bowlby One",
      "Bowlby One SC",
      "Brawler",
      "Bree Serif",
      "Brygada 1918",
      "Bubblegum Sans",
      "Bubbler One",
      "Buda",
      "Buenard",
      "Bungee",
      "Bungee Hairline",
      "Bungee Inline",
      "Bungee Outline",
      "Bungee Shade",
      "Butcherman",
      "Butterfly Kids",
      "Cabin Condensed",
      "Cabin Sketch",
      "Caesar Dressing",
      "Cagliostro",
      "Caladea",
      "Calistoga",
      "Calligraffitti",
      "Cambay",
      "Cambo",
      "Candal",
      "Cantarell",
      "Cantata One",
      "Cantora One",
      "Capriola",
      "Cardo",
      "Carme",
      "Carrois Gothic",
      "Carrois Gothic SC",
      "Carter One",
      "Castoro",
      "Caveat",
      "Caveat Brush",
      "Cedarville Cursive",
      "Ceviche One",
      "Chakra Petch",
      "Changa",
      "Changa One",
      "Chango",
      "Charm",
      "Charmonman",
      "Chathura",
      "Chau Philomene One",
      "Chela One",
      "Chelsea Market",
      "Chenla",
      "Cherry Cream Soda",
      "Cherry Swash",
      "Chewy",
      "Chicle",
      "Chilanka",
      "Chonburi",
      "Cinzel",
      "Cinzel Decorative",
      "Clicker Script",
      "Coda",
      "Coda Caption",
      "Codystar",
      "Coiny",
      "Combo",
      "Comforter",
      "Comforter Brush",
      "Comic Neue",
      "Coming Soon",
      "Commissioner",
      "Condiment",
      "Content",
      "Contrail One",
      "Convergence",
      "Cookie",
      "Copse",
      "Corben",
      "Corinthia",
      "Cormorant Infant",
      "Cormorant SC",
      "Cormorant Unicase",
      "Cormorant Upright",
      "Courgette",
      "Courier Prime",
      "Covered By Your Grace",
      "Crafty Girls",
      "Creepster",
      "Crete Round",
      "Crimson Pro",
      "Croissant One",
      "Crushed",
      "Cuprum",
      "Cute Font",
      "Cutive",
      "Cutive Mono",
      "Damion",
      "Dangrek",
      "Darker Grotesque",
      "David Libre",
      "Dawning of a New Day",
      "Days One",
      "Dekko",
      "Delius",
      "Delius Swash Caps",
      "Delius Unicase",
      "Della Respira",
      "Denk One",
      "Devonshire",
      "Dhurjati",
      "Didact Gothic",
      "Diplomata",
      "Diplomata SC",
      "Do Hyeon",
      "Dokdo",
      "Domine",
      "Donegal One",
      "Dongle",
      "Doppio One",
      "Dorsa",
      "Droid Sans",
      "Droid Sans Mono",
      "Droid Serif",
      "Duru Sans",
      "Dynalight",
      "Eagle Lake",
      "East Sea Dokdo",
      "Eater",
      "Economica",
      "Eczar",
      "Edu NSW ACT Foundation",
      "Edu QLD Beginner",
      "Edu SA Beginner",
      "Edu TAS Beginner",
      "Edu VIC WA NT Beginner",
      "Electrolize",
      "Elsie",
      "Elsie Swash Caps",
      "Emblema One",
      "Emilys Candy",
      "Encode Sans Condensed",
      "Encode Sans Expanded",
      "Encode Sans Semi Condensed",
      "Encode Sans Semi Expanded",
      "Engagement",
      "Englebert",
      "Enriqueta",
      "Ephesis",
      "Epilogue",
      "Erica One",
      "Esteban",
      "Estonia",
      "Euphoria Script",
      "Ewert",
      "Exo",
      "Expletus Sans",
      "Explora",
      "Fahkwang",
      "Fanwood Text",
      "Farro",
      "Farsan",
      "Fascinate",
      "Fascinate Inline",
      "Faster One",
      "Fasthand",
      "Fauna One",
      "Faustina",
      "Federant",
      "Federo",
      "Felipa",
      "Fenix",
      "Festive",
      "Finger Paint",
      "Fira Sans Condensed",
      "Fira Sans Extra Condensed",
      "Fjalla One",
      "Fjord One",
      "Flamenco",
      "Flavors",
      "Fleur De Leah",
      "Flow Block",
      "Flow Circular",
      "Flow Rounded",
      "Fondamento",
      "Fontdiner Swanky",
      "Forum",
      "Francois One",
      "Frank Ruhl Libre",
      "Fraunces",
      "Freckle Face",
      "Fredericka the Great",
      "Fredoka",
      "Fredoka One",
      "Freehand",
      "Fresca",
      "Frijole",
      "Fruktur",
      "Fugaz One",
      "Fuggles",
      "Fuzzy Bubbles",
      "GFS Didot",
      "GFS Neohellenic",
      "Gabriela",
      "Gaegu",
      "Gafata",
      "Galada",
      "Galdeano",
      "Galindo",
      "Gamja Flower",
      "Gayathri",
      "Gelasio",
      "Gemunu Libre",
      "Genos",
      "Gentium Basic",
      "Gentium Book Basic",
      "Gentium Book Plus",
      "Gentium Plus",
      "Geo",
      "Georama",
      "Geostar",
      "Geostar Fill",
      "Germania One",
      "Gideon Roman",
      "Gidugu",
      "Gilda Display",
      "Girassol",
      "Give You Glory",
      "Glass Antiqua",
      "Glegoo",
      "Gloria Hallelujah",
      "Glory",
      "Gluten",
      "Goblin One",
      "Gochi Hand",
      "Goldman",
      "Gorditas",
      "Gothic A1",
      "Gotu",
      "Goudy Bookletter 1911",
      "Gowun Batang",
      "Gowun Dodum",
      "Graduate",
      "Grand Hotel",
      "Grandstander",
      "Grape Nuts",
      "Gravitas One",
      "Great Vibes",
      "Grechen Fuemen",
      "Grenze",
      "Grenze Gotisch",
      "Grey Qo",
      "Griffy",
      "Gruppo",
      "Gudea",
      "Gugi",
      "Gupter",
      "Gurajada",
      "Gwendolyn",
      "Habibi",
      "Hachi Maru Pop",
      "Hahmlet",
      "Halant",
      "Hammersmith One",
      "Hanalei",
      "Hanalei Fill",
      "Handlee",
      "Hanuman",
      "Happy Monkey",
      "Harmattan",
      "Headland One",
      "Hepta Slab",
      "Herr Von Muellerhoff",
      "Hi Melody",
      "Hina Mincho",
      "Hind Guntur",
      "Hind Madurai",
      "Hind Siliguri",
      "Hind Vadodara",
      "Holtwood One SC",
      "Homemade Apple",
      "Homenaje",
      "Hubballi",
      "Hurricane",
      "IBM Plex Mono",
      "IBM Plex Sans Condensed",
      "IBM Plex Serif",
      "IM Fell DW Pica",
      "IM Fell DW Pica SC",
      "IM Fell Double Pica",
      "IM Fell Double Pica SC",
      "IM Fell English",
      "IM Fell English SC",
      "IM Fell French Canon",
      "IM Fell French Canon SC",
      "IM Fell Great Primer",
      "IM Fell Great Primer SC",
      "Ibarra Real Nova",
      "Iceberg",
      "Iceland",
      "Imbue",
      "Imperial Script",
      "Imprima",
      "Inconsolata",
      "Inder",
      "Ingrid Darling",
      "Inika",
      "Inknut Antiqua",
      "Inria Sans",
      "Inria Serif",
      "Inspiration",
      "Inter Tight",
      "Irish Grover",
      "Island Moments",
      "Istok Web",
      "Italiana",
      "Italianno",
      "Itim",
      "Jacques Francois",
      "Jacques Francois Shadow",
      "Jaldi",
      "JetBrains Mono",
      "Jim Nightshade",
      "Joan",
      "Jockey One",
      "Jolly Lodger",
      "Jomhuria",
      "Jomolhari",
      "Josefin Slab",
      "Joti One",
      "Jua",
      "Judson",
      "Julee",
      "Julius Sans One",
      "Junge",
      "Jura",
      "Just Another Hand",
      "Just Me Again Down Here",
      "K2D",
      "Kadwa",
      "Kaisei Decol",
      "Kaisei HarunoUmi",
      "Kaisei Opti",
      "Kaisei Tokumin",
      "Kalam",
      "Kameron",
      "Kanit",
      "Kantumruy",
      "Kantumruy Pro",
      "Karantina",
      "Karla",
      "Karma",
      "Katibeh",
      "Kaushan Script",
      "Kavivanar",
      "Kavoon",
      "Kdam Thmor Pro",
      "Keania One",
      "Kelly Slab",
      "Kenia",
      "Khand",
      "Khmer",
      "Khula",
      "Kings",
      "Kirang Haerang",
      "Kite One",
      "Kiwi Maru",
      "Klee One",
      "Knewave",
      "KoHo",
      "Kodchasan",
      "Koh Santepheap",
      "Kolker Brush",
      "Kosugi",
      "Kosugi Maru",
      "Kotta One",
      "Koulen",
      "Kranky",
      "Kreon",
      "Kristi",
      "Krona One",
      "Krub",
      "Kufam",
      "Kulim Park",
      "Kumar One",
      "Kumar One Outline",
      "Kumbh Sans",
      "Kurale",
      "La Belle Aurore",
      "Lacquer",
      "Laila",
      "Lakki Reddy",
      "Lalezar",
      "Lancelot",
      "Langar",
      "Lateef",
      "League Gothic",
      "League Script",
      "League Spartan",
      "Leckerli One",
      "Ledger",
      "Lekton",
      "Lemon",
      "Lemonada",
      "Lexend Deca",
      "Lexend Exa",
      "Lexend Giga",
      "Lexend Mega",
      "Lexend Peta",
      "Lexend Tera",
      "Lexend Zetta",
      "Libre Barcode 128",
      "Libre Barcode 128 Text",
      "Libre Barcode 39",
      "Libre Barcode 39 Extended",
      "Libre Barcode 39 Extended Text",
      "Libre Barcode 39 Text",
      "Libre Barcode EAN13 Text",
      "Libre Bodoni",
      "Libre Caslon Display",
      "Libre Caslon Text",
      "Life Savers",
      "Lilita One",
      "Lily Script One",
      "Limelight",
      "Linden Hill",
      "Literata",
      "Liu Jian Mao Cao",
      "Livvic",
      "Lobster",
      "Lobster Two",
      "Londrina Outline",
      "Londrina Shadow",
      "Londrina Sketch",
      "Londrina Solid",
      "Long Cang",
      "Lora",
      "Love Light",
      "Love Ya Like A Sister",
      "Loved by the King",
      "Lovers Quarrel",
      "Luckiest Guy",
      "Lusitana",
      "Lustria",
      "Luxurious Roman",
      "Luxurious Script",
      "M PLUS 1",
      "M PLUS 1 Code",
      "M PLUS 1p",
      "M PLUS 2",
      "M PLUS Code Latin",
      "M PLUS Rounded 1c",
      "Ma Shan Zheng",
      "Macondo",
      "Macondo Swash Caps",
      "Mada",
      "Magra",
      "Maiden Orange",
      "Maitree",
      "Major Mono Display",
      "Mako",
      "Mali",
      "Mallanna",
      "Mandali",
      "Manjari",
      "Mansalva",
      "Manuale",
      "Marcellus",
      "Marcellus SC",
      "Marck Script",
      "Margarine",
      "Markazi Text",
      "Marko One",
      "Marmelad",
      "Martel",
      "Martel Sans",
      "Marvel",
      "Mate",
      "Mate SC",
      "Material Icons",
      "Material Icons Outlined",
      "Material Icons Round",
      "Material Icons Sharp",
      "Material Icons Two Tone",
      "Material Symbols Outlined",
      "Material Symbols Rounded",
      "Material Symbols Sharp",
      "Maven Pro",
      "McLaren",
      "Mea Culpa",
      "Meddon",
      "MedievalSharp",
      "Medula One",
      "Meera Inimai",
      "Megrim",
      "Meie Script",
      "Meow Script",
      "Merienda",
      "Merienda One",
      "Merriweather Sans",
      "Metal",
      "Metal Mania",
      "Metamorphous",
      "Metrophobic",
      "Michroma",
      "Milonga",
      "Miltonian",
      "Miltonian Tattoo",
      "Mina",
      "Miniver",
      "Miriam Libre",
      "Mirza",
      "Miss Fajardose",
      "Mitr",
      "Mochiy Pop One",
      "Mochiy Pop P One",
      "Modak",
      "Modern Antiqua",
      "Mogra",
      "Mohave",
      "Molengo",
      "Molle",
      "Monda",
      "Monofett",
      "Monoton",
      "Monsieur La Doulaise",
      "Montaga",
      "Montagu Slab",
      "MonteCarlo",
      "Montez",
      "Montserrat Alternates",
      "Montserrat Subrayada",
      "Moo Lah Lah",
      "Moon Dance",
      "Moul",
      "Moulpali",
      "Mountains of Christmas",
      "Mouse Memoirs",
      "Mr Bedfort",
      "Mr Dafoe",
      "Mr De Haviland",
      "Mrs Saint Delafield",
      "Mrs Sheppards",
      "Ms Madi",
      "Mukta Mahee",
      "Mukta Malar",
      "Mukta Vaani",
      "Muli",
      "Murecho",
      "MuseoModerno",
      "My Soul",
      "Mystery Quest",
      "NTR",
      "Nanum Brush Script",
      "Nanum Gothic Coding",
      "Nanum Myeongjo",
      "Nanum Pen Script",
      "Neonderthaw",
      "Nerko One",
      "Neucha",
      "Neuton",
      "New Rocker",
      "New Tegomin",
      "News Cycle",
      "Newsreader",
      "Niconne",
      "Niramit",
      "Nixie One",
      "Nobile",
      "Nokora",
      "Norican",
      "Nosifer",
      "Notable",
      "Nothing You Could Do",
      "Noticia Text",
      "Noto Color Emoji",
      "Noto Emoji",
      "Noto Kufi Arabic",
      "Noto Music",
      "Noto Naskh Arabic",
      "Noto Nastaliq Urdu",
      "Noto Rashi Hebrew",
      "Noto Sans Arabic",
      "Noto Sans Bengali",
      "Noto Sans Devanagari",
      "Noto Sans Display",
      "Noto Sans Georgian",
      "Noto Sans Hebrew",
      "Noto Sans HK",
      "Noto Sans JP",
      "Noto Sans KR",
      "Noto Sans Mono",
      "Noto Sans SC",
      "Noto Sans TC",
      "Noto Sans Thai",
      "Noto Serif",
      "Noto Serif Bengali",
      "Noto Serif Devanagari",
      "Noto Serif Display",
      "Noto Serif Georgian",
      "Noto Serif Hebrew",
      "Noto Serif JP",
      "Noto Serif KR",
      "Noto Serif SC",
      "Noto Serif TC",
      "Noto Serif Thai",
      "Nova Cut",
      "Nova Flat",
      "Nova Mono",
      "Nova Oval",
      "Nova Round",
      "Nova Script",
      "Nova Slim",
      "Nova Square",
      "Numans",
      "Nunito",
      "Nunito Sans",
      "Nuosu SIL",
      "Odibee Sans",
      "Odor Mean Chey",
      "Offside",
      "Oi",
      "Old Standard TT",
      "Oldenburg",
      "Ole",
      "Oleo Script",
      "Oleo Script Swash Caps",
      "Oooh Baby",
      "Open Sans Condensed",
      "Oranienbaum",
      "Orbit",
      "Orbitron",
      "Oregano",
      "Orelega One",
      "Orienta",
      "Original Surfer",
      "Oswald",
      "Otomanopee One",
      "Outfit",
      "Over the Rainbow",
      "Overlock",
      "Overlock SC",
      "Overpass",
      "Overpass Mono",
      "Ovo",
      "Oxanium",
      "Oxygen Mono",
      "PT Mono",
      "PT Sans Caption",
      "PT Sans Narrow",
      "PT Serif",
      "PT Serif Caption",
      "Pacifico",
      "Padauk",
      "Padyakke Expanded One",
      "Palanquin",
      "Palanquin Dark",
      "Palette Mosaic",
      "Pangolin",
      "Paprika",
      "Parisienne",
      "Passero One",
      "Passion One",
      "Passions Conflict",
      "Pathway Gothic One",
      "Patrick Hand",
      "Patrick Hand SC",
      "Pattaya",
      "Patua One",
      "Pavanam",
      "Paytone One",
      "Peddana",
      "Peralta",
      "Permanent Marker",
      "Petemoss",
      "Petit Formal Script",
      "Petrona",
      "Phetsarath",
      "Philosopher",
      "Piazzolla",
      "Piedra",
      "Pinyon Script",
      "Pirata One",
      "Plaster",
      "Play",
      "Playball",
      "Playfair Display SC",
      "Podkova",
      "Poiret One",
      "Poller One",
      "Poly",
      "Pompiere",
      "Pontano Sans",
      "Poor Story",
      "Poppins",
      "Port Lligat Sans",
      "Port Lligat Slab",
      "Potta One",
      "Pragati Narrow",
      "Praise",
      "Prata",
      "Preahvihear",
      "Press Start 2P",
      "Pridi",
      "Princess Sofia",
      "Prociono",
      "Prompt",
      "Prosto One",
      "Proza Libre",
      "Public Sans",
      "Puppies Play",
      "Puritan",
      "Purple Purse",
      "Qahiri",
      "Quando",
      "Quantico",
      "Quattrocento",
      "Quattrocento Sans",
      "Questrial",
      "Quicksand",
      "Quintessential",
      "Qwigley",
      "Qwitcher Grypen",
      "Racing Sans One",
      "Radio Canada",
      "Radley",
      "Rajdhani",
      "Rakkas",
      "Raleway Dots",
      "Ramabhadra",
      "Ramaraja",
      "Rambla",
      "Rammetto One",
      "Rampart One",
      "Ranchers",
      "Rancho",
      "Ranga",
      "Rasa",
      "Rationale",
      "Ravi Prakash",
      "Readex Pro",
      "Recursive",
      "Red Hat Mono",
      "Red Hat Text",
      "Red Rose",
      "Redacted",
      "Redacted Script",
      "Redressed",
      "Reem Kufi",
      "Reenie Beanie",
      "Reggae One",
      "Revalia",
      "Rhodium Libre",
      "Ribeye",
      "Ribeye Marrow",
      "Righteous",
      "Risque",
      "Road Rage",
      "Roboto Flex",
      "Rochester",
      "Rock Salt",
      "RocknRoll One",
      "Rokkitt",
      "Romanesco",
      "Ropa Sans",
      "Rosario",
      "Rosarivo",
      "Rouge Script",
      "Rowdies",
      "Rozha One",
      "Rubik Beastly",
      "Rubik Bubbles",
      "Rubik Burned",
      "Rubik Dirt",
      "Rubik Distressed",
      "Rubik Glitch",
      "Rubik Marker Hatch",
      "Rubik Maze",
      "Rubik Microbe",
      "Rubik Mono One",
      "Rubik Moonrocks",
      "Rubik Puddles",
      "Rubik Wet Paint",
      "Ruda",
      "Rufina",
      "Ruge Boogie",
      "Ruluko",
      "Rum Raisin",
      "Ruslan Display",
      "Russo One",
      "Ruthie",
      "Rye",
      "STIX Two Math",
      "STIX Two Text",
      "Sacramento",
      "Sahitya",
      "Sail",
      "Saira Condensed",
      "Saira Extra Condensed",
      "Saira Semi Condensed",
      "Saira Stencil One",
      "Salsa",
      "Sanchez",
      "Sancreek",
      "Sansita",
      "Sansita Swashed",
      "Sarabun",
      "Sarala",
      "Sarina",
      "Sarpanch",
      "Sassy Frass",
      "Satisfy",
      "Sawarabi Gothic",
      "Sawarabi Mincho",
      "Scada",
      "Scheherazade New",
      "Schoolbell",
      "Scope One",
      "Seaweed Script",
      "Secular One",
      "Sedgwick Ave",
      "Sedgwick Ave Display",
      "Sen",
      "Send Flowers",
      "Sevillana",
      "Seymour One",
      "Shadows Into Light Two",
      "Shalimar",
      "Shanti",
      "Share",
      "Share Tech",
      "Share Tech Mono",
      "Shippori Antique",
      "Shippori Antique B1",
      "Shippori Mincho",
      "Shippori Mincho B1",
      "Shizuru",
      "Shojumaru",
      "Short Stack",
      "Shrikhand",
      "Siemreap",
      "Sigmar One",
      "Signika Negative",
      "Silkscreen",
      "Simonetta",
      "Single Day",
      "Sintony",
      "Sirin Stencil",
      "Six Caps",
      "Skranji",
      "Slabo 13px",
      "Slackey",
      "Smokum",
      "Smooch",
      "Smooch Sans",
      "Smythe",
      "Sniglet",
      "Snippet",
      "Snowburst One",
      "Sofadi One",
      "Sofia",
      "Sofia Sans",
      "Sofia Sans Condensed",
      "Sofia Sans Extra Condensed",
      "Sofia Sans Semi Condensed",
      "Solitreo",
      "Solway",
      "Song Myung",
      "Sophia",
      "Sora",
      "Sorts Mill Goudy",
      "Source Code Pro",
      "Source Sans 3",
      "Source Serif 4",
      "Source Serif Pro",
      "Space Mono",
      "Spartan",
      "Special Elite",
      "Spectral SC",
      "Spicy Rice",
      "Spinnaker",
      "Spirax",
      "Splash",
      "Spline Sans",
      "Spline Sans Mono",
      "Squada One",
      "Square Peg",
      "Sree Krushnadevaraya",
      "Sriracha",
      "Srisakdi",
      "Staatliches",
      "Stalemate",
      "Stalinist One",
      "Stardos Stencil",
      "Stick",
      "Stick No Bills",
      "Stint Ultra Condensed",
      "Stint Ultra Expanded",
      "Stoke",
      "Strait",
      "Style Script",
      "Stylish",
      "Sue Ellen Francisco",
      "Suez One",
      "Sulphur Point",
      "Sumana",
      "Sunflower",
      "Sunshiney",
      "Supermercado One",
      "Sura",
      "Suranna",
      "Suravaram",
      "Suwannaphum",
      "Swanky and Moo Moo",
      "Syncopate",
      "Syne",
      "Syne Mono",
      "Syne Tactile",
      "Tajawal",
      "Tangerine",
      "Tapestry",
      "Taprom",
      "Tauri",
      "Taviraj",
      "Teko",
      "Telex",
      "Tenali Ramakrishna",
      "Tenor Sans",
      "Text Me One",
      "Texturina",
      "Thasadith",
      "The Girl Next Door",
      "The Nautigal",
      "Tienne",
      "Tillana",
      "Tilt Neon",
      "Tilt Prism",
      "Tilt Warp",
      "Timmana",
      "Tinos",
      "Tiro Bangla",
      "Tiro Devanagari Hindi",
      "Tiro Devanagari Marathi",
      "Tiro Devanagari Sanskrit",
      "Tiro Gurmukhi",
      "Tiro Kannada",
      "Tiro Tamil",
      "Tiro Telugu",
      "Titan One",
      "Trade Winds",
      "Train One",
      "Trirong",
      "Trispace",
      "Trocchi",
      "Trochut",
      "Truculenta",
      "Trykker",
      "Tulpen One",
      "Turret Road",
      "Twinkle Star",
      "Ubuntu Condensed",
      "Ubuntu Mono",
      "Uchen",
      "Ultra",
      "Uncial Antiqua",
      "Underdog",
      "Unica One",
      "UnifrakturCook",
      "UnifrakturMaguntia",
      "Unkempt",
      "Unlock",
      "Unna",
      "Updock",
      "Urbanist",
      "Varta",
      "Vast Shadow",
      "Vazirmatn",
      "Vesper Libre",
      "Viaoda Libre",
      "Vibes",
      "Vibur",
      "Vidaloka",
      "Viga",
      "Voces",
      "Volkhov",
      "Vollkorn SC",
      "Voltaire",
      "Vujahday Script",
      "Waiting for the Sunrise",
      "Wallpoet",
      "Walter Turncoat",
      "Warnes",
      "Water Brush",
      "Waterfall",
      "Wellfleet",
      "Wendy One",
      "Whisper",
      "WindSong",
      "Wire One",
      "Wix Madefor Display",
      "Wix Madefor Text",
      "Work Sans",
      "Xanh Mono",
      "Yaldevi",
      "Yanone Kaffeesatz",
      "Yantramanav",
      "Yatra One",
      "Yellowtail",
      "Yeon Sung",
      "Yeseva One",
      "Yesteryear",
      "Yomogi",
      "Yrsa",
      "Ysabeau",
      "Ysabeau Infant",
      "Ysabeau Office",
      "Ysabeau SC",
      "Yuji Boku",
      "Yuji Hentaigana Akari",
      "Yuji Hentaigana Akebono",
      "Yuji Mai",
      "Yuji Syuku",
      "Yusei Magic",
      "ZCOOL KuaiLe",
      "ZCOOL QingKe HuangYou",
      "ZCOOL XiaoWei",
      "Zen Antique",
      "Zen Antique Soft",
      "Zen Dots",
      "Zen Kaku Gothic Antique",
      "Zen Kaku Gothic New",
      "Zen Kurenaido",
      "Zen Loop",
      "Zen Maru Gothic",
      "Zen Old Mincho",
      "Zen Tokyo Zoo",
      "Zeyada",
      "Zhi Mang Xing",
      "Zilla Slab Highlight",
    ];
    // Remove duplicates
    googleFonts.allFonts = [...new Set(googleFonts.allFonts)].sort();
    return googleFonts.allFonts;
  } catch (error) {
    console.error("Failed to load font list:", error);
    return googleFonts.popular;
  }
}

// Font picker state - separate state for each picker
const fontPickerState = {
  headline: { category: "popular", search: "" },
  subheadline: { category: "popular", search: "" },
  element: { category: "popular", search: "" },
};

// Tracks which picker triggered the custom font upload
let _customFontUploadContext = null;

// Initialize all font pickers
function initFontPicker() {
  initSingleFontPicker("headline", {
    picker: "font-picker",
    trigger: "font-picker-trigger",
    dropdown: "font-picker-dropdown",
    search: "font-search",
    list: "font-picker-list",
    preview: "font-picker-preview",
    hidden: "headline-font",
    stateKey: "headlineFont",
  });

  initSingleFontPicker("subheadline", {
    picker: "subheadline-font-picker",
    trigger: "subheadline-font-picker-trigger",
    dropdown: "subheadline-font-picker-dropdown",
    search: "subheadline-font-search",
    list: "subheadline-font-picker-list",
    preview: "subheadline-font-picker-preview",
    hidden: "subheadline-font",
    stateKey: "subheadlineFont",
  });

  initSingleFontPicker("element", {
    picker: "element-font-picker",
    trigger: "element-font-picker-trigger",
    dropdown: "element-font-picker-dropdown",
    search: "element-font-search",
    list: "element-font-picker-list",
    preview: "element-font-picker-preview",
    hidden: "element-font",
    stateKey: "font",
    getFont: () => {
      const el = getSelectedElement();
      return el ? el.font : "";
    },
    setFont: (value) => {
      if (selectedElementId)
        setElementProperty(selectedElementId, "font", value);
    },
  });

  // Custom font upload handler (shared across all pickers)
  const customFontInput = document.getElementById("custom-font-input");
  if (customFontInput) {
    customFontInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      const fontName = file.name.replace(/\.[^/.]+$/, "");
      try {
        const arrayBuffer = await file.arrayBuffer();
        await saveCustomFont(
          fontName,
          arrayBuffer,
          file.type || "font/truetype",
        );
        if (_customFontUploadContext) {
          renderFontList(
            _customFontUploadContext.pickerId,
            _customFontUploadContext.ids,
          );
        }
      } catch (err) {
        await showAppAlert("Failed to load font: " + err.message, "error");
      }
    });
  }
}

// Initialize a single font picker instance
function initSingleFontPicker(pickerId, ids) {
  const trigger = document.getElementById(ids.trigger);
  const dropdown = document.getElementById(ids.dropdown);
  const searchInput = document.getElementById(ids.search);
  const picker = document.getElementById(ids.picker);

  if (!trigger || !dropdown) return;

  // Toggle dropdown
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close other font picker dropdowns
    document.querySelectorAll(".font-picker-dropdown.open").forEach((d) => {
      if (d.id !== ids.dropdown) d.classList.remove("open");
    });
    dropdown.classList.toggle("open");
    if (dropdown.classList.contains("open")) {
      searchInput.focus();
      renderFontList(pickerId, ids);
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(`#${ids.picker}`)) {
      dropdown.classList.remove("open");
    }
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    fontPickerState[pickerId].search = e.target.value.toLowerCase();
    renderFontList(pickerId, ids);
  });

  // Prevent dropdown close when clicking inside
  dropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Category buttons
  const categoryButtons = picker.querySelectorAll(".font-category");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      fontPickerState[pickerId].category = btn.dataset.category;
      renderFontList(pickerId, ids);
    });
  });

  // Initial render
  renderFontList(pickerId, ids);
}

// Render the font list for a specific picker
async function renderFontList(pickerId, ids) {
  const fontList = document.getElementById(ids.list);
  if (!fontList) return;

  const pickerState = fontPickerState[pickerId];
  let fonts = [];
  const currentFont = ids.getFont
    ? ids.getFont()
    : getTextSettings()[ids.stateKey];

  if (pickerState.category === "system") {
    fonts = googleFonts.system.map((f) => ({
      name: f.name,
      value: f.value,
      category: "system",
    }));
  } else if (pickerState.category === "popular") {
    fonts = googleFonts.popular.map((name) => ({
      name,
      value: `'${name}', sans-serif`,
      category: "google",
    }));
  } else if (pickerState.category === "custom") {
    fonts = googleFonts.custom.map((f) => ({
      name: f.name,
      value: f.value,
      category: "custom",
    }));
  } else {
    // All fonts
    const allFonts = await fetchAllGoogleFonts();
    fonts = [
      ...googleFonts.system.map((f) => ({
        name: f.name,
        value: f.value,
        category: "system",
      })),
      ...allFonts.map((name) => ({
        name,
        value: `'${name}', sans-serif`,
        category: "google",
      })),
    ];
  }

  // Filter by search
  if (pickerState.search) {
    fonts = fonts.filter((f) =>
      f.name.toLowerCase().includes(pickerState.search),
    );
  }

  // Build upload row HTML for custom category
  const uploadRowHtml =
    pickerState.category === "custom"
      ? `<div class="font-upload-row">
        <button class="font-upload-btn" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Font
        </button>
        <span class="font-upload-note">.ttf .otf .woff .woff2</span>
      </div>`
      : "";

  // Limit to prevent performance issues
  const displayFonts = fonts.slice(0, 100);

  if (displayFonts.length === 0) {
    if (pickerState.category === "custom") {
      fontList.innerHTML =
        uploadRowHtml +
        '<div class="font-picker-empty">No custom fonts yet. Upload one above.</div>';
    } else {
      fontList.innerHTML =
        '<div class="font-picker-empty">No fonts found</div>';
    }
  } else {
    fontList.innerHTML =
      uploadRowHtml +
      displayFonts
        .map((font) => {
          const isSelected =
            currentFont &&
            (currentFont.includes(font.name) || currentFont === font.value);
          const isLoaded =
            font.category === "system" ||
            font.category === "custom" ||
            googleFonts.loaded.has(font.name);
          const isLoading = googleFonts.loading.has(font.name);

          return `
              <div class="font-option ${isSelected ? "selected" : ""}"
                   data-font-name="${font.name}"
                   data-font-value="${font.value}"
                   data-font-category="${font.category}">
                  <span class="font-option-name" style="font-family: ${isLoaded ? font.value : "inherit"}">${font.name}</span>
                  ${
                    isLoading
                      ? '<span class="font-option-loading">Loading...</span>'
                      : `<span class="font-option-category">${font.category}</span>`
                  }
                  ${font.category === "custom" ? `<button class="font-option-delete" data-font-name="${font.name}" title="Remove font" type="button">×</button>` : ""}
              </div>
          `;
        })
        .join("");
  }

  // Upload button handler (for custom category)
  if (pickerState.category === "custom") {
    const uploadBtn = fontList.querySelector(".font-upload-btn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        _customFontUploadContext = { pickerId, ids };
        document.getElementById("custom-font-input").click();
      });
    }
    // Delete button handlers
    fontList.querySelectorAll(".font-option-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        deleteCustomFont(btn.dataset.fontName);
        renderFontList(pickerId, ids);
      });
    });
  }

  // Add click handlers
  fontList.querySelectorAll(".font-option").forEach((option) => {
    option.addEventListener("click", async () => {
      const fontName = option.dataset.fontName;
      const fontValue = option.dataset.fontValue;
      const fontCategory = option.dataset.fontCategory;

      // Load Google Font if needed
      if (fontCategory === "google") {
        option.querySelector(".font-option-category").textContent =
          "Loading...";
        option
          .querySelector(".font-option-category")
          .classList.add("font-option-loading");
        await loadGoogleFont(fontName);
        option.querySelector(".font-option-name").style.fontFamily = fontValue;
        option.querySelector(".font-option-category").textContent = "google";
        option
          .querySelector(".font-option-category")
          .classList.remove("font-option-loading");
      }

      // Update state
      document.getElementById(ids.hidden).value = fontValue;
      if (ids.setFont) {
        ids.setFont(fontValue);
      } else {
        setTextValue(ids.stateKey, fontValue);
      }

      // Update preview
      const preview = document.getElementById(ids.preview);
      preview.textContent = fontName;
      preview.style.fontFamily = fontValue;

      // Update selection in list
      fontList
        .querySelectorAll(".font-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");

      // Close dropdown
      document.getElementById(ids.dropdown).classList.remove("open");

      updateCanvas();
    });

    // Preload font on hover for better UX
    option.addEventListener("mouseenter", () => {
      const fontName = option.dataset.fontName;
      const fontCategory = option.dataset.fontCategory;
      if (fontCategory === "google" && !googleFonts.loaded.has(fontName)) {
        loadGoogleFont(fontName).then(() => {
          option.querySelector(".font-option-name").style.fontFamily =
            option.dataset.fontValue;
        });
      }
    });
  });
}

// Update font picker preview from state
function updateFontPickerPreview() {
  updateSingleFontPickerPreview(
    "headline-font",
    "font-picker-preview",
    "headlineFont",
  );
  updateSingleFontPickerPreview(
    "subheadline-font",
    "subheadline-font-picker-preview",
    "subheadlineFont",
  );
}

function updateSingleFontPickerPreview(hiddenId, previewId, stateKey) {
  const preview = document.getElementById(previewId);
  const hiddenInput = document.getElementById(hiddenId);
  if (!preview || !hiddenInput) return;

  const text = getTextSettings();
  const fontValue = text[stateKey];
  if (!fontValue) return;

  hiddenInput.value = fontValue;

  // Extract font name from value
  let fontName = "SF Pro Display";
  const systemFont = googleFonts.system.find((f) => f.value === fontValue);
  if (systemFont) {
    fontName = systemFont.name;
  } else {
    // Try to extract from Google Font value like "'Roboto', sans-serif"
    const match = fontValue.match(/'([^']+)'/);
    if (match) {
      fontName = match[1];
      // Load the font if it's a Google Font
      loadGoogleFont(fontName);
    }
  }

  preview.textContent = fontName;
  preview.style.fontFamily = fontValue;
}

function updateElementFontPickerPreview(el) {
  const preview = document.getElementById("element-font-picker-preview");
  const hiddenInput = document.getElementById("element-font");
  if (!preview || !hiddenInput || !el) return;

  const fontValue = el.font;
  if (!fontValue) return;

  hiddenInput.value = fontValue;

  let fontName = "SF Pro Display";
  const systemFont = googleFonts.system.find((f) => f.value === fontValue);
  if (systemFont) {
    fontName = systemFont.name;
  } else {
    const match = fontValue.match(/'([^']+)'/);
    if (match) {
      fontName = match[1];
      loadGoogleFont(fontName);
    }
  }

  preview.textContent = fontName;
  preview.style.fontFamily = fontValue;
}
