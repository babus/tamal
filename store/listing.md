# Chrome Web Store listing

Copy these into the developer dashboard. The name and summary come from the manifest
(`extension/_locales/*/messages.json`), so they show up automatically in English and Tamil.

| Field | Value |
|---|---|
| Name | Tamal – Malayalam to Tamil Script |
| Summary | Read Malayalam in Tamil letters. Convert Malayalam text, a selection or a whole web page to Tamil script. Offline and private. |
| Category | Tools (Productivity also fits) |
| Language | English, plus a Tamil (தமிழ்) listing: add it under *Store listing → Language* |
| Privacy policy URL | https://gist.github.com/babus/1100d37cd6fd2b9c5eca86edf1358f37 (source: `privacy.md`) |
| Homepage URL | https://github.com/babus/tamal |
| Support URL | https://github.com/babus/tamal/issues |
| Store icon | `icon-128.png` (128×128: 96×96 artwork with 16px transparent padding) |
| Screenshots | `screenshot-1.png`, `screenshot-2.png` (1280×800) |
| Small promo tile | `promo-small.png` (440×280) |
| Marquee promo tile | `promo-marquee.png` (1400×560) |

## Privacy tab answers

- **Single purpose**: Shows Malayalam text in Tamil script, so people who read Tamil can read Malayalam.
- **activeTab**: Reads and converts the current page, only when the user clicks the popup button or a right-click menu item.
- **scripting**: Runs the converter on the current page after that click.
- **contextMenus**: Adds "Show selection in Tamil script" and "Convert this page to Tamil script" to the right-click menu.
- **Remote code**: No, I am not using remote code.
- **Data usage**: Tick nothing. Then tick all three certifications: no selling data, no use unrelated to the single purpose, no use for credit or lending.

## Detailed description (English)

```
Read Malayalam in Tamil letters.

Tamal converts Malayalam script to Tamil script. The words stay Malayalam; only the letters change. If you read Tamil but not Malayalam script, you can now read Malayalam news, song lyrics, stories, recipes and messages, and sound them out as you go.

എനിക്ക് മലയാളം അറിയാം  →  எனிக்கு மலயாளம் அறியாம்

HOW TO USE
• Paste Malayalam text into the popup and read the Tamil-script version as you type
• Select Malayalam text on any page, right-click and choose "Show selection in Tamil script"
• Right-click a page and choose "Convert this page to Tamil script". Text that loads later, as you scroll, is converted too
• Click "Copy output" to paste the result anywhere

WHO IT'S FOR
• Tamil speakers who want to read Malayalam websites, WhatsApp forwards or lyrics
• People learning Malayalam who already know Tamil script
• Families and friends across Tamil Nadu and Kerala sharing messages

PRIVATE AND OFFLINE
• Works without an internet connection. All conversion happens in your browser
• No accounts, ads, analytics or tracking. Nothing you read or paste leaves your device
• Runs on a page only when you click it. No "read all websites" permission
• Open source (MIT). Read the code or report a problem: https://github.com/babus/tamal

HOW THE CONVERSION WORKS
Malayalam has more letters than Tamil, so Tamal follows the way Tamil readers already pronounce words:
• ക ഖ ഗ ഘ become க, and പ ബ ഭ become ப (ഭാരതം → பாரதம்); ഫ becomes ஃப (ഫോൺ → ஃபோண்)
• ന becomes ந at the start of a word and ன elsewhere (എന്ന → என்ன)
• The short "u" at the end of words is written ு (അത് → அது)
• Chillu letters become consonant + pulli (അവൻ → அவன்)

Tamal is transliteration, not translation. It changes the script, not the language.

WHY IT WORKS SO WELL
Tamil and Malayalam are close cousins. They even share a letter no other Indian script has: ഴ in Malayalam and ழ in Tamil, the "zh" at the end of Thamizh. Tamal maps it straight across (മഴ → மழ, "rain"), along with the other letters the two scripts share: ള → ள, റ → ற, ണ → ண.

தமிழில்
மலையாள எழுத்து தெரியாதவர்களுக்காக, மலையாளத்தைத் தமிழ் எழுத்துகளில் காட்டுகிறது Tamal. வார்த்தைகள் மலையாளமே; எழுத்துகள் மட்டும் தமிழ். உரையை ஒட்டலாம், தேர்ந்தெடுத்த பகுதியை மாற்றலாம், அல்லது முழு வலைப்பக்கத்தையும் மாற்றலாம். இணையம் தேவையில்லை; எந்தத் தரவும் சேகரிக்கப்படுவதில்லை.
```

## Detailed description (Tamil listing)

```
மலையாளத்தைத் தமிழ் எழுத்துகளில் படியுங்கள்.

Tamal மலையாள எழுத்தைத் தமிழ் எழுத்தாக மாற்றுகிறது. வார்த்தைகள் மலையாளமே; எழுத்துகள் மட்டும் தமிழ். தமிழ் படிக்கத் தெரிந்தால், மலையாளச் செய்திகள், பாடல் வரிகள், கதைகள், செய்திகளை இனி நீங்களே படிக்கலாம்.

എനിക്ക് മലയാളം അറിയാം  →  எனிக்கு மலயாளம் அறியாம்

பயன்படுத்துவது எப்படி
• மலையாள உரையை popup-இல் ஒட்டுங்கள்; தமிழ் எழுத்தில் உடனே தெரியும்
• பக்கத்தில் மலையாள உரையைத் தேர்ந்தெடுத்து, right-click செய்து "Show selection in Tamil script" என்பதைத் தேர்வுசெய்யுங்கள்
• பக்கத்தில் right-click செய்து "Convert this page to Tamil script" என்பதைத் தேர்வுசெய்தால் முழுப் பக்கமும் மாறும்

தனியுரிமை
• இணையம் தேவையில்லை. எல்லாமே உங்கள் browser-இலேயே நடக்கிறது
• கணக்கு, விளம்பரம், கண்காணிப்பு எதுவும் இல்லை. நீங்கள் படிப்பதோ ஒட்டுவதோ வெளியே செல்வதில்லை
• திறந்த மூல நிரல் (MIT): https://github.com/babus/tamal

இது மொழிபெயர்ப்பு அல்ல; எழுத்துப்பெயர்ப்பு மட்டுமே.

ழ-வின் உறவு
தமிழும் மலையாளமும் நெருங்கிய உறவு மொழிகள். வேறு எந்த இந்திய எழுத்திலும் இல்லாத ழ, மலையாளத்திலும் ഴ என இருக்கிறது. Tamal அதை நேரடியாக மாற்றுகிறது: മഴ → மழ.
```

## Search notes

- The Web Store has no keyword field. Search matches the name, summary and description, so
  the phrases people type ("Malayalam to Tamil", "Malayalam in Tamil letters", "Malayalam
  transliteration") are written into those naturally. Don't add a keyword list: the store's
  spam policy rejects keyword stuffing.
- The Tamil listing lets people who search in Tamil (மலையாளம் தமிழ்) find it.
- Ratings and installs weigh heavily in ranking. Ask the first users to leave a review.
- Once the repo is public, link it as the website and from the description. A public
  source link helps trust, and GitHub pages get indexed by Google.
