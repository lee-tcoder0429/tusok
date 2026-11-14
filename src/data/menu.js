export const MENU = [
  { id: 'fishball', reviews: 214, name: 'Fishball', category: 'prito', price: 20, unit: '5 pcs', rating: 4.8, tags: ['bestseller'], sold: 980, addedAt: '2026-06-02', available: true,
    desc: 'Ang OG ng kanto. Malutong sa labas, malambot sa loob — sawsaw agad sa matamis na sauce.' },
  { id: 'kwek', reviews: 256, name: 'Kwek-kwek', category: 'prito', price: 30, unit: '3 pcs', rating: 4.9, tags: ['bestseller'], sold: 1120, addedAt: '2026-06-10', available: true,
    desc: 'Itlog ng pugo na binalot sa orange na batter. Pinakamasarap kapag may suka at pipino.' },
  { id: 'kikiam', reviews: 98, name: 'Kikiam', category: 'prito', price: 25, unit: '4 pcs', rating: 4.5, tags: [], sold: 540, addedAt: '2026-07-15', available: true,
    desc: 'Chewy, savory, at laging kasama ng fishball. Hindi kumpleto ang tusok kung wala nito.' },
  { id: 'chickenskin', reviews: 121, name: 'Chicken skin', category: 'prito', price: 35, unit: 'cup', rating: 4.6, tags: ['maanghang'], sold: 610, addedAt: '2026-09-20', available: true,
    desc: 'Sobrang lutong na balat ng manok na may spicy suka. Guilty pleasure, walang pagsisisi.' },
  { id: 'isaw', reviews: 187, name: 'Isaw', category: 'ihaw', price: 15, unit: 'stick', rating: 4.7, tags: ['maanghang', 'bestseller'], sold: 890, addedAt: '2026-06-05', available: true,
    desc: 'Inihaw na bituka ng manok, smoky at medyo maanghang. Pang-matapang na tusok.' },
  { id: 'betamax', reviews: 54, name: 'Betamax', category: 'ihaw', price: 15, unit: 'stick', rating: 4.3, tags: [], sold: 310, addedAt: '2026-08-01', available: false,
    desc: 'Inihaw na dugo na hugis cassette tape. Classic sa ihawan — try mo, promise okay siya.' },
  { id: 'turon', reviews: 143, name: 'Turon', category: 'matamis', price: 25, unit: 'pc', rating: 4.8, tags: ['matamis'], sold: 760, addedAt: '2026-10-12', available: true,
    desc: 'Saging at langka sa lumpia wrapper, binalot sa caramelized na asukal. Merienda goals.' },
  { id: 'bananacue', reviews: 89, name: 'Banana cue', category: 'matamis', price: 25, unit: 'stick', rating: 4.6, tags: ['matamis'], sold: 580, addedAt: '2026-08-22', available: true,
    desc: 'Saging na saba na pinrito sa pulang asukal. Mainit-init pa, dalawang piraso kada stick.' },
  { id: 'taho', reviews: 132, name: 'Taho', category: 'panulak', price: 25, unit: 'cup', rating: 4.7, tags: ['matamis'], sold: 700, addedAt: '2026-11-03', available: true,
    desc: 'Malambot na tokwa, arnibal, at sago. "Tahooo!" — pang-umaga pero pwede kahit kailan.' },
  { id: 'gulaman', reviews: 110, name: "Sago't Gulaman", category: 'panulak', price: 30, unit: '16oz', rating: 4.5, tags: ['matamis'], sold: 650, addedAt: '2026-10-28', available: true,
    desc: 'Malamig na panulak na may sago at gulaman. Pampawi ng uhaw pagkatapos ng prito.' },
]

export const byId = Object.fromEntries(MENU.map((m) => [m.id, m]))

export const SAWSAWAN = [
  { id: 'matamis', name: 'Matamis', desc: 'Brown sauce, medyo malapot' },
  { id: 'maanghang', name: 'Maanghang', desc: 'May sili, pang-matapang' },
  { id: 'suka', name: 'Suka', desc: 'Sukang may sibuyas at pipino' },
]

export const peso = (n) => `₱${n}`

// Sample reviews for the demo (not real customers)
export const REVIEWS = {
  fishball: [['Suki sa kanto', 5, 'Mainit pa pagdating, tapos ang lutong. Babalik ako.'], ['Estudyanteng gutom', 4, 'Sulit sa ₱20. Sana mas marami pang sauce.']],
  kwek: [['Suki sa kanto', 5, 'Hindi tinipid sa batter, buo pa ang itlog.'], ['Taga-kabilang block', 5, 'Pinakamasarap na may suka at pipino.']],
  kikiam: [['Estudyanteng gutom', 4, 'Chewy, tamang alat. Bagay sa matamis na sauce.'], ['Suki sa kanto', 5, 'Laging kasama sa order ko.']],
  chickenskin: [['Taga-kabilang block', 5, 'Sobrang lutong, hindi mamantika.'], ['Estudyanteng gutom', 4, 'Maanghang nga! Kailangan ng gulaman.']],
  isaw: [['Suki sa kanto', 5, 'Malinis ang pagkakaluto, walang pait.'], ['Taga-kabilang block', 4, 'Smoky. Isang stick lang, bitin.']],
  betamax: [['Estudyanteng gutom', 4, 'First time ko, okay naman pala.'], ['Suki sa kanto', 4, 'Classic. Laging nauubos agad.']],
  turon: [['Taga-kabilang block', 5, 'May langka! Malutong ang balat.'], ['Suki sa kanto', 5, 'Pang-merienda araw-araw.']],
  bananacue: [['Estudyanteng gutom', 5, 'Makapal ang caramel, mainit pa.'], ['Taga-kabilang block', 4, 'Matamis masyado para sa akin pero masarap.']],
  taho: [['Suki sa kanto', 5, 'Malambot ang tokwa, hindi tinipid ang arnibal.'], ['Estudyanteng gutom', 5, 'Pampagising bago mag-klase.']],
  gulaman: [['Taga-kabilang block', 4, 'Malamig at hindi sobrang tamis.'], ['Suki sa kanto', 5, 'Perfect pagkatapos ng fishball.']],
}
