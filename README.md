# game-of-life
## As a web component.

## Adding
Simply add this repo as a submodule `git submodule add https://github.com/Skrywerbeer/game-of-life`.
And then in your page.

```html
<script src="path/to/game-of-life/gameOfLife.js"></script>
<game-of-life></game-of-life>
```

## Attributes
Use `rows` and `columns` to set the size of the game's grid. These attributes
default to 50 if unset.
Set `running` to "run" to enable periodic ticking of the game every `interval`.

## Styling
For sizing and positioning the element use the `game-of-life` selector.
To set the color of the cells use one of
```css
game-of-life::part(cell) {background-color: color}
game-of-life::part(living) {background-color: color}
game-of-life::part(deceased) {background-color: color}
```
