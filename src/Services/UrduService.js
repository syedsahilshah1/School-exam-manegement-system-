// Basic Urdu Phonetic Mapping for Transliteration
// Maps English phonetic characters to Urdu characters

const mapping = {
    'a': 'ا',
    'b': 'ب',
    'c': 'چ',
    'd': 'د',
    'e': 'ع',
    'f': 'ف',
    'g': 'گ',
    'h': 'ہ',
    'i': 'ی',
    'j': 'ج',
    'k': 'ک',
    'l': 'ل',
    'm': 'م',
    'n': 'ن',
    'o': 'و',
    'p': 'پ',
    'q': 'ق',
    'r': 'ر',
    's': 'س',
    't': 'ت',
    'u': 'و',
    'v': 'و',
    'w': 'و',
    'x': 'ش',
    'y': 'ی',
    'z': 'ز',
    'A': 'آ',
    'B': 'بھ',
    'D': 'ڈ',
    'E': 'ء',
    'G': 'غ',
    'H': 'ح',
    'I': 'ئ',
    'J': 'جھ',
    'K': 'کھ',
    'L': 'ل',
    'M': 'م',
    'N': 'ں',
    'O': 'ۃ',
    'P': 'پھ',
    'R': 'ڑ',
    'S': 'ص',
    'T': 'ٹ',
    'W': 'و',
    'X': 'ژ',
    'Y': 'ے',
    'Z': 'ذ',
    ';': '؛',
    ',': '،',
    '?': '؟',
    '.': '۔',
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹',
    '0': '۰',
};

// More complex combinations
const doubleMapping = {
    'sh': 'ش',
    'kh': 'خ',
    'th': 'تھ',
    'ch': 'چ',
    'gh': 'غ',
    'dh': 'دھ',
    'ph': 'پھ',
    'bh': 'بھ',
    'jh': 'جھ',
    'Rh': 'ڑھ',
    'kh': 'خ',
};

export const transliterateToUrdu = (text) => {
    let result = '';
    let i = 0;
    while (i < text.length) {
        let char2 = text.substring(i, i + 2);
        if (doubleMapping[char2]) {
            result += doubleMapping[char2];
            i += 2;
        } else {
            let char1 = text.charAt(i);
            result += mapping[char1] || char1;
            i++;
        }
    }
    return result;
};

export const urduKeyboardLayout = [
    ['ق', 'و', 'ع', 'ر', 'ت', 'ے', 'و', 'ی', 'ہ', 'پ'],
    ['ا', 'س', 'د', 'ف', 'گ', 'ہ', 'ج', 'ک', 'ل'],
    ['ز', 'ش', 'چ', 'ط', 'ب', 'ن', 'م'],
    ['ئ', 'ء', 'آ', 'ڈ', 'ٹ', 'ڑ', 'ژ', 'ذ', 'غ', 'خ']
];
