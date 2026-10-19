// Run: node scripts/validate-kg3-english.mjs [path-to-kg3-english-json-folder]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const letterWindow = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/kg3-letters.js'), 'utf8'), {window: letterWindow}, {timeout: 1000});
assert.throws(() => letterWindow.letterGuideMarkup('not a letter'));
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const guides = [...alphabet].map(letter => letterWindow.letterGuideMarkup(letter));
assert.equal(new Set(guides).size, 52);
assert(guides.every(svg => svg.includes('M8 20H112M8 100H112') && svg.includes('stroke-dasharray="3 3"')));
const folder = path.join(root, 'question/KG-3_English');
const expected = {
  uppercase: [26, 'Match upper case'], lowercase: [26, 'Match lower case'],
  consonants_mcq: [100, 'Consonant'], vowels_mcq: [100, 'Vowels'],
  vowel_a: [100, 'Vowel a'], vowel_e: [100, 'Vowel e'], vowel_i: [100, 'Vowel i'],
  vowel_o: [101, 'Vowel o'], vowel_u: [91, 'Vowel U'],
  sh_words: [100, 'Words Sh'], ch_words: [110, 'Words Ch'],
  singular_form: [96, 'Singular Form'], plural_form: [105, 'plural Form'],
  plural_singular: [100, 'Cocktail Plural/ Singular'], a_an: [100, 'Articles A/An'],
  have_has: [101, 'Have/ Has'], do_did: [98, 'Do/ Did'],
  verbs: [101, 'Verbs'],
};
const menuPath = path.join(root, 'start-page2/KG_3/kg3_eng_options.html');
const menu = fs.readFileSync(menuPath, 'utf8');
const links = [...menu.matchAll(/href="([^"]+kg3_eng_[^"]+\.html)"/g)].map(m => m[1]);
assert.equal(links.length, 18);
assert(links[0].endsWith('kg3_eng_uppercase.html'));
assert(links[1].endsWith('kg3_eng_lowercase.html'));
assert.equal(new Set(links).size, 18);
assert.deepEqual([...menu.matchAll(/class="card-title">([^<]+)<\/h3>/g)].map(m => m[1]), Object.values(expected).map(([, title]) => title));
const jsonFiles = process.argv[2]
  ? fs.readdirSync(process.argv[2]).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(process.argv[2], f), 'utf8')))
  : null;
if (jsonFiles) assert.equal(jsonFiles.length, 18);

let total = 0, images = 0;
for (const [order, [suffix, [count, title]]] of Object.entries(expected).entries()) {
  const filename = `kg3_eng_${suffix}.html`;
  const source = fs.readFileSync(path.join(folder, filename), 'utf8');
  assert.equal(source.match(/<title>([^<]+)<\/title>/)?.[1], `${title} — KG3 English`, filename);
  const match = source.match(/const questions\s*=\s*(\[[\s\S]*?\n\s*\]);/);
  assert(match, filename);
  const bank = JSON.parse(JSON.stringify(vm.runInNewContext(match[1], {}, {timeout: 1000})));
  assert.equal(bank.length, count, filename);
  assert(links.some(link => path.resolve(path.dirname(menuPath), link) === path.join(folder, filename)));
  assert(links[order].endsWith(filename), filename);
  total += bank.length;
  const data = jsonFiles?.find(file => file._source_file === filename);
  if (jsonFiles) {
    assert(data, filename);
    assert.equal(data.total_questions, count);
    assert.equal(data.questions.length, count);
    assert.equal(data.questions_per_attempt, 25);
    assert.equal(data.order_index, order);
    assert.equal(data.title, title);
    assert.equal(data.level, 'kg3');
    assert.equal(data.subject, 'english');
    assert.equal(data.shuffle, 'question');
  }
  for (const [i, q] of bank.entries()) {
    const label = `${filename} q${i + 1}`;
    assert(q.question.trim(), label);
    assert(!q.question.includes('\uFFFD'), label);
    assert(q.options.length >= 2 && q.options.length <= 4, label);
    assert(q.options.every(option => typeof option === 'string' && option.trim()), label);
    assert.equal(new Set(q.options).size, q.options.length, label);
    assert(q.options.includes(q.correct), label);
    assert(q.explanation, label);
    if (suffix === 'verbs') {
      assert.equal(q.question, 'Look at the picture and choose the correct verb.', label);
      assert.equal(q.image, `../../image/KG3 English Verbs/${i + 1}.png`, label);
      assert(q.alt?.trim(), label);
    }
    if (q.image) {
      const asset = fs.readFileSync(path.resolve(folder, q.image));
      assert.equal(asset.subarray(1, 4).toString(), 'PNG', label);
      assert(asset.readUInt32BE(16) > 24 && asset.readUInt32BE(20) > 24, label);
      images++;
    }
    if (suffix === 'uppercase' || suffix === 'lowercase') {
      const glyph = q.question.match(/class="case-letter" data-letter="([A-Za-z])"/)?.[1];
      assert(glyph, label);
      assert(q.question.includes('stroke-dasharray="3 3"'), label);
      assert(q.question.includes(letterWindow.letterGuideMarkup(glyph, '#e23744')), label);
      assert.equal(q.correct, suffix === 'uppercase' ? glyph.toLowerCase() : glyph.toUpperCase(), label);
      assert(q.options.every(option => suffix === 'uppercase' ? /^[a-z]$/.test(option) : /^[A-Z]$/.test(option)), label);
    }
    if (data) {
      const exported = data.questions[i];
      assert.equal(exported.slug, `q${String(i + 1).padStart(3, '0')}`, label);
      assert.equal(exported.order_index, i + 1, label);
      assert.equal(exported.prompt, q.question, label);
      assert.deepEqual(exported.options.choices, q.options.map((text, index) => ({id: `c${index + 1}`, text})), label);
      assert.deepEqual(exported.answer_key.correct, [`c${q.options.indexOf(q.correct) + 1}`], label);
      assert.equal(exported.explanation, q.explanation, label);
      assert.equal(exported.type, q.image ? 'image' : 'mcq', label);
      if (q.image) {
        assert.equal(exported.media.source_path, q.image, label);
        if (suffix === 'verbs') assert.equal(exported.media.alt, q.alt, label);
        const prefix = q.image.includes('/KG_Vowel_E/') ? 'questions/shared/' : 'questions/kg3/english/';
        assert.equal(exported.media.path, prefix + q.image.split('/image/')[1].replace(/\.[^.]+$/, '.webp'), label);
      } else assert.equal(exported.media, null, label);
    }
  }
  if (suffix === 'uppercase' || suffix === 'lowercase') {
    assert.equal(new Set(bank.map(q => q.correct.toLowerCase())).size, 26);
    assert.equal(new Set(bank.map(q => JSON.stringify(q))).size, 26);
    assert.equal(new Set(bank.map(q => q.options.indexOf(q.correct))).size, 3);
  }
}
assert.equal(total, 1655);
assert.equal(images, 1204);
console.log(`Validated 18 banks, ${total} questions, ${images} image references, menu links${jsonFiles ? ' and all JSON exports' : ''}.`);
