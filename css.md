# CSS

## CSS Variables with User Settings, Defaults

CSS variables (a.k.a. 'custom properties') can be set by declaring them like any other
CSS property:


```css
:root {
  --xy-border-width:      1mm;
  }
```

They can then be referenced using the `var()` construct. Inside the parentheses of `var()`, there are two
fields, the first being the name of a custom property, and the second a literal fallback value. The fallback
can, in turn, reference *another* variable but only if it is written itself as a `var()` reference.

When more than one declarations of the same variable are applicable, then the most recent one will win
(assuming their specificity is the same). This is usually the desired behavior. However, in a website where
you want to load a stylesheet upfront that contains variable declarations filled out by the user, such that
those values can be used throughout the components of the site, one would prefer to have a way to set
default values within components that will be overridden by user settings *where present*. In an imperative
language, we might be able to express 'set x to this default value unless it has already been set to a value
before' by something like

```coffee
x = x ? 42
```

where `x ? y` evaluates to the value left of the `?` existential operator when `x` is bound to any value
other than the base value, and to the value right of the operator otherwise. Some languages taht lack an
existential operator might need you to write a full `if` / `then` / `else` statement; on the other hand, there are
languages that offer

```coffee
x ?= 42
```

or else

```js
x == null ? 42 : x;
```

which are just variations on the theme. Unfortunately, CSS does not have any of these constructs, so one
would hope that a construct like `property-x: var(--some-variable, default value)` which *does* allow
fallbacks in property-value binding declarations would help. However, the catch with that is that **the CSS
`var()` construct does not allow to reference the *same* variable on the left-hand side and on the
right-hand side**, so this is not allowed:

```css
/* in `variables.css`: */
:root { --xy-border-width: 1mm; }

/* in `component-xy.css`: */
:root { --xy-border-width: var(--xy-border-width, 2mm); }
.xy   { border-width: var(--xy-border-width); }

```

If this worked, its meaning would be: 'use a default `border-width` of `2mm` for component `xy`, but just in
case it has not already been set to a value at that point'.

One way to circumvent this restriction is to avoid using user-configurable CSS variable names in your styles
and, instead, use a variant formed by adding a prefix or suffix, such as `CFG`:

```css
/* in `variables.css`: */
:root { --xy-border-width: 1mm; }

/* in `component-xy.css`: */
:root { --xy-border-width-CFG: var(--xy-border-width, 2mm); }
.xy   { border-width: var(--xy-border-width-CFG); }
```

This way, we avoid using the left-hand name on the right-hand side in `--xy-border-width-CFG:
var(--xy-border-width, 2mm)` but do get a chance to declare a default value, everything in a single,
manageable line of CSS. One good thing one could say about this pattern is that we now have an obvious way
to search all the spots in our styles where user-configurable variables are used, and what their names are.

