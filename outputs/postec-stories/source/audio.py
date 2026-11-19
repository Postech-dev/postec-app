"""Original 120 BPM synthesized music and event-timed SFX; no sampled songs."""
from pathlib import Path
from sfx import *

init(25)
groove(0,24,bpm=120,level=.52,
       chords=((60,64,67,71),(57,60,64,67),(53,57,60,64),(55,59,62,69)),
       roots=(36,33,29,31))
for t in (.32,.50,.68): put(pop(330),t,.08)
for t in (5,10,15,20):
    put(whoosh(.6),t-.38,.16,verb=.08)
    put(bell(784,.8),t+.1,.08,verb=.15)
put(tick(.025,2200),12.16,.15)
put(bell(1046,.9),20.7,.1,verb=.1)
master(str(Path(__file__).with_name('sound.wav')),fade_out=1.2,drive=1.2)
