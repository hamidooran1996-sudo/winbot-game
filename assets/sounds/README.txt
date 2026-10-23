أصوات حقيقية للعبة (اختياري)
================================
1) نزّل حزمة CC0 المجانية «Pool And Billiards SFX» (SURAJ KISPOTTA) من:
   https://papapleygames.itch.io/pool-and-billiards
   وفيها: 6 أصوات كرة-كرة، 3 كرة-حافة، كرة في الجيب، 4 ضربات عصا (WAV).
2) انسخ الملفات التي تريدها إلى هذا المجلد (يفضَّل تحويلها إلى MP3 صغير الحجم).
3) اذكر أسماءها في manifest.json، مثال:
   {
     "hit":     ["ball-ball-1.mp3", "ball-ball-2.mp3", "ball-ball-3.mp3"],
     "cushion": ["wall-1.mp3", "wall-2.mp3"],
     "pocket":  ["pocket-1.mp3"],
     "cue":     ["shoot-1.mp3", "shoot-2.mp3"]
   }
4) تُستخدم تلقائيا مع تغيير الشدة والنغمة بحسب سرعة الاصطدام؛ وإن لم توجد ملفات يعمل الصوت المولَّد.
