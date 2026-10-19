// Print letters share the same cap line, middle line, baseline and descender space.
(function () {
  const letters = {
    A: 'M20 100L60 20L100 100M35 70H85',
    B: 'M30 100V20H60C100 20 100 60 60 60H30M60 60C105 60 105 100 60 100H30',
    C: 'M94 32C80 12 30 12 25 60C20 108 80 112 94 88',
    D: 'M30 100V20H55C115 20 115 100 55 100H30',
    E: 'M95 20H30V100H95M30 60H82',
    F: 'M95 20H30V100M30 60H82',
    G: 'M94 32C80 12 25 12 25 60C25 110 95 110 95 65H65',
    H: 'M28 20V100M92 20V100M28 60H92',
    I: 'M38 20H82M60 20V100M38 100H82',
    J: 'M43 20H90M78 20V78C78 112 30 108 30 82',
    K: 'M30 20V100M92 20L30 65M53 50L95 100',
    L: 'M30 20V100H95',
    M: 'M20 100V20L60 72L100 20V100',
    N: 'M28 100V20L92 100V20',
    O: 'M60 20C12 20 12 100 60 100C108 100 108 20 60 20Z',
    P: 'M30 100V20H62C105 20 105 62 62 62H30',
    Q: 'M60 20C12 20 12 100 60 100C108 100 108 20 60 20ZM72 82L98 112',
    R: 'M30 100V20H62C105 20 105 62 62 62H30M60 62L98 100',
    S: 'M94 30C72 9 26 17 28 42C30 66 94 55 94 80C94 108 45 108 25 90',
    T: 'M20 20H100M60 20V100',
    U: 'M28 20V72C28 110 92 110 92 72V20',
    V: 'M20 20L60 100L100 20',
    W: 'M15 20L35 100L60 48L85 100L105 20',
    X: 'M25 20L95 100M95 20L25 100',
    Y: 'M20 20L60 65L100 20M60 65V100',
    Z: 'M25 20H95L25 100H95',
    a: 'M85 60V100M85 80C85 53 35 53 35 80C35 107 85 107 85 80Z',
    b: 'M35 20V100M35 80C35 53 85 53 85 80C85 107 35 107 35 80Z',
    c: 'M84 67C65 52 35 60 35 80C35 100 65 108 84 93',
    d: 'M85 20V100M85 80C85 53 35 53 35 80C35 107 85 107 85 80Z',
    e: 'M35 80H85C85 52 35 52 35 80C35 105 66 106 83 94',
    f: 'M45 100V40C45 20 63 14 78 24M28 60H78',
    g: 'M85 60V108C85 135 48 138 35 122M85 80C85 53 35 53 35 80C35 107 85 107 85 80Z',
    h: 'M35 20V100M35 80C35 53 85 53 85 80V100',
    i: 'M60 60V100M60 38V39',
    j: 'M70 60V112C70 133 50 138 35 124M70 38V39',
    k: 'M35 20V100M85 60L35 85M57 74L87 100',
    l: 'M60 20V100',
    m: 'M20 100V60M20 75C20 55 60 55 60 75V100M60 75C60 55 100 55 100 75V100',
    n: 'M35 100V60M35 80C35 53 85 53 85 80V100',
    o: 'M60 60C27 60 27 100 60 100C93 100 93 60 60 60Z',
    p: 'M35 60V130M35 80C35 53 85 53 85 80C85 107 35 107 35 80Z',
    q: 'M85 60V130M85 80C85 53 35 53 35 80C35 107 85 107 85 80Z',
    r: 'M40 100V60M40 78C40 60 61 54 80 64',
    s: 'M83 66C67 54 38 58 38 70C38 84 83 76 83 90C83 104 51 105 35 94',
    t: 'M55 35V85C55 103 72 105 83 94M32 60H82',
    u: 'M35 60V82C35 106 85 106 85 82M85 60V100',
    v: 'M30 60L60 100L90 60',
    w: 'M18 60L37 100L60 67L83 100L102 60',
    x: 'M35 60L85 100M85 60L35 100',
    y: 'M30 60L60 100M90 60L47 130',
    z: 'M35 60H85L35 100H85'
  };

  // The question letter is drawn red so it stands out; answer letters stay dark.
  window.letterGuideMarkup = function (letter, color = '#232a3b') {
    if (!Object.hasOwn(letters, letter)) throw new Error('Expected one English letter');
    return '<svg class="letter-guides" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160" aria-hidden="true" focusable="false">' +
      '<path d="M8 20H112M8 100H112" fill="none" stroke="#e23744" stroke-width="1.2"/>' +
      '<path d="M8 60H112" fill="none" stroke="#e23744" stroke-width="1.2" stroke-dasharray="3 3"/>' +
      '<path d="' + letters[letter] + '" fill="none" stroke="' + color + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg><span class="letter-label">' + letter + '</span>';
  };
})();
