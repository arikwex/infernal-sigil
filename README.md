# 🔥👑 Infernal Throne 👑🔥
## Play it online NOW
- INFERNAL THRONE is a mini Metroidvania compressed in to 13kb.
- https://arikwex.github.io/infernal-sigil/

![400x250-infernal-throne](https://user-images.githubusercontent.com/1320825/189513114-63dc29bb-1fda-45e4-b18a-0f7468794425.png)


## The Story
Your seat on the Infernal Throne has been overruled. The Demon King has banished 
you to the depths of Hell and stripped you of your infernal Aspects. Navigate
the Underworld and its dangers while searching for a way to regain your strength.
The Throne awaits you...

## Controls
Keyboard Option 1:
```
- [Arrow Keys] to move
- [Z] to jump
- [X] to attack
- [C] Use Aspect 1 (once learned)
- [V] Use Aspect 2 (once learned)
- [M] Show map
```

Keyboard Option 2 (post-JS13k):
```
- [WASD] to move
- [Space] to jump
- [J] to attack
- [K] Use Aspect 1 (once learned)
- [L] Use Aspect 2 (once learned)
- [N] Show map
```

Gamepad (post-JS13k):
```
- [Left Analog] or [DPad] to move
- [South Button] to jump
- [West Button] to attack
- [East Button] or [Left Trigger] Use Aspect 1 (once learned)
- [North Button] Use Aspect 2 (once learned)
- [Left Bumper] Show map
```

## Development
```
# Setup
nvm use
npm i

# Build tools
npm run dev         # Build + watch (build)
npm run dev:minify  # Build + watch (build + minify)
npm run build       # Build (build + minify + roadroller)
```
The build tools will always output:
- index.html (The single html file you can open in browser to play)
- build.zip (The zipped html file which should be under 13,312 bytes when using `npm run build`)
