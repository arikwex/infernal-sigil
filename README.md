# Infernal Throne
## Play it online NOW
- 🔥👑 INFERNAL THRONE 👑🔥 is a mini Metroidvania compressed in to 13kb.
- Play online HERE: https://arikwex.github.io/infernal-sigil/

## The Story
Your seat on the Infernal Throne has been overruled. The Demon King has banished 
you to the depths of Hell and stripped you of your infernal Aspects. Navigate
the Underworld and its dangers while searching for a way to regain your strength.
The Throne awaits you...

## Controls
Gameplay Tutorial:
- [Arrow Keys] to move
- [Z] to jump
- [X] to attack
- [C] Use Aspect 1 (once learned)
- [V] Use Aspect 2 (once learned)
- [M] Show map

## Development
```
# Setup
nvm use
npm i

# Build tools
npm run dev      # Build + watch (build)
npm run dev:mid  # Build + watch (build + minify)
npm run build    # Build (build + minify + roadroller)
```
The build tools will always output:
- index.html (The single html file you can open in browser to play)
- build.zip (The zipped html file which should be under 13,312 bytes when using `npm run build`)