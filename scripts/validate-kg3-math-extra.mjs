// Run: node scripts/validate-kg3-math-extra.mjs [path-to-kg3-math-json-folder]
// Independent checks for the six extra KG-3 math pages: maths re-derived from the
// visible content, unique choices, assets, menu links and HTML <-> JSON parity.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'question/KG-3_math');
const jsonDir = process.argv[2] || 'C:/Users/aarah/Downloads/update data/LOYAL MCQ_S DATA/kg3/math';
const pages = {
  ten_frame: ['math-ten-frame', 'Ten Frame'], same_number: ['math-same-number', 'Same Number'],
  odd_one_out: ['math-odd-one-out', 'Odd One Out'], heavy_light: ['math-heavy-light', 'Heavy or Light'],
  ordinal: ['math-ordinal', 'First, Second, Third'], fair_share: ['math-fair-share', 'Fair Share'],
};
const seg = new Intl.Segmenter('en', {granularity: 'grapheme'});
const glyphs = s => [...seg.segment(s)].map(x => x.segment).filter(g => g.trim());
const strip = s => s.replace(/<small[^>]*>.*?<\/small>/g, '').replace(/<[^>]+>/g, '');
const ORD = ['1st', '2nd', '3rd'];
const WORD = {FIRST: 0, SECOND: 1, THIRD: 2};

const menuPath = path.join(root, 'start-page2/KG_3/kg3_math_options.html');
const menu = fs.readFileSync(menuPath, 'utf8');
const links = [...menu.matchAll(/href="([^"]+)" class="card-btn"/g)].map(m => path.resolve(path.dirname(menuPath), m[1]));
assert.equal(links.length, 16, 'menu keeps 10 old + 6 new cards');
links.forEach(l => assert(fs.existsSync(l), l));
assert.equal(new Set(fs.readdirSync(jsonDir).map(f => JSON.parse(fs.readFileSync(path.join(jsonDir, f), 'utf8')).slug)).size,
  fs.readdirSync(jsonDir).length, 'unique slugs');

let total = 0;
for (const [suffix, [slug, title]] of Object.entries(pages)) {
  const file = `kg3_math_${suffix}.html`;
  const src = fs.readFileSync(path.join(folder, file), 'utf8');
  assert(links.includes(path.join(folder, file)), `${file} linked from menu`);
  assert(src.includes(`<title>${title}</title>`), file);
  for (const asset of src.matchAll(/(?:href|src)="(\.\.\/\.\.\/[^"]+)"/g)) assert(fs.existsSync(path.resolve(folder, asset[1])), asset[1]);
  const bank = vm.runInNewContext(src.match(/const questions = (\[[\s\S]*?\n\s*\]);/)[1]);
  const data = JSON.parse(fs.readFileSync(path.join(jsonDir, `${slug}.json`), 'utf8'));
  assert.equal(bank.length, 100, file);
  assert.equal(data.questions.length, 100);
  assert.equal(data.total_questions, 100);
  assert.deepEqual([data.slug, data.title, data.level, data.subject, data.quiz_type, data.questions_per_attempt, data._source_file],
    [slug, title, 'kg3', 'math', 'tap_select', 25, file]);
  const seen = new Set();
  bank.forEach((q, i) => {
    const tag = `${file} q${i + 1}`;
    const ex = data.questions[i];
    const labels = q.items.map(it => strip(it.label));
    const right = q.items.findIndex(it => it.correct);
    assert.equal(q.items.filter(it => it.correct).length, 1, tag);
    assert.equal(new Set(labels).size, labels.length, tag);
    assert(q.explanation.includes(labels[right]) || suffix === "fair_share" && /fair/.test(q.explanation), tag);
    const key = q.question + labels.join('|') + (q.image || '');
    assert(!seen.has(key), `${tag} duplicate`); seen.add(key);

    // ---- JSON parity
    assert.equal(ex.slug, `q${String(i + 1).padStart(3, '0')}`);
    assert.equal(ex.order_index, i + 1);
    assert.equal(ex.type, 'tap_select');
    assert.equal(ex.explanation, q.explanation, tag);
    assert(!/[<>]/.test(ex.prompt), tag);
    assert.equal(ex.options.mode, 'match');
    assert.equal(ex.options.choices.length, q.items.length, tag);
    ex.options.choices.forEach((c, j) => {
      assert.equal(c.id, `c${j + 1}`);
      assert.equal(c.text ?? c.emoji.repeat(c.count), labels[j], tag);
    });
    assert.deepEqual(ex.answer_key.correct, [`c${right + 1}`], tag);
    assert.equal(ex.media?.source_path ?? null, q.image ?? null, tag);
    if (q.image) {
      const png = fs.readFileSync(path.resolve(folder, q.image));
      assert.equal(png.subarray(1, 4).toString(), 'PNG', tag);
      assert(q.alt && ex.media.alt === q.alt, tag);
    }
    const sceneText = q.question.match(/class="tap-scene">([^<]+)</)?.[1];
    if (sceneText) assert.equal(ex.options.scene.emoji.repeat(ex.options.scene.count), sceneText, tag);
    else assert.equal(ex.options.scene, undefined, tag);

    // ---- Maths, re-derived from what the child sees
    const n = Number(labels[right]);
    if (suffix === 'ten_frame') {
      const dots = Number(q.image.match(/tf_(\d\d)_/)[1]);
      assert.equal(n, /empty/.test(q.question) ? 10 - dots : dots, tag);
    } else if (suffix === 'same_number') {
      const want = sceneText ? glyphs(sceneText).length : Number(strip(q.question).match(/\d+/)[0]);
      const counts = labels.map(l => glyphs(l).length);
      assert.equal(counts[right], want, tag);
      assert.equal(counts.filter(c => c === want).length, 1, tag);
    } else if (suffix === 'odd_one_out' && /number/.test(q.question)) {
      const counts = labels.map(l => glyphs(l).length);
      assert.equal(counts.filter(c => c === counts[right]).length, 1, tag);
      assert.equal(new Set(counts.filter((_, j) => j !== right)).size, 1, tag);
    } else if (suffix === 'ordinal') {
      if (/What place/.test(q.question)) {
        const line = glyphs(strip(q.question).split('What place')[0]).slice(2);
        const who = glyphs(strip(q.question).split('the ')[1])[0];
        assert.equal(labels[right], ORD[line.indexOf(who)], tag);
      } else {
        const word = q.question.match(/<strong>(\w+)<\/strong>/)[1];
        assert.equal(right, word === 'LAST' ? labels.length - 1 : WORD[word], tag);
        assert.equal(q.layout, 'row', tag);
      }
    } else if (suffix === 'fair_share') {
      if (sceneText) {
        const kids = glyphs(strip(q.question).split('fairly with')[1].split('.')[0]).length;
        assert.equal(n * kids, glyphs(sceneText).length, tag);
      } else {
        const [a, b] = q.question.match(/kg3-share">(.*?)<\/span>/)[1].split('<br>').map(r => glyphs(r).length - 1);
        assert.equal(labels[right], a === b ? '👍 Fair' : '👎 Not fair', tag);
      }
    }
  });
  total += bank.length;
  console.log(`${file}: ${bank.length} ok`);
}
console.log(`All six pages valid (${total} questions).`);
