# From theme tokens to a Figma design

1. Read the theme CSS (`:root { --x: … }`) and turn each token into a Figma **variable** in one collection,
   with scopes (fills / text / stroke / gap / radius) and WEB code syntax `var(--x)`.
2. Create text styles from the product font (RTR: Source Sans Pro; Khmer fallback Kantumruy Pro): H1 28/34 bold,
   H2 20/26, Card title 16/22, Body 15/22, Caption 13/18, Overline 11/14 +1.2 tracking, KPI number 26/32.
3. Components (variants): Button (Primary/Outline/Warning/Danger), Status Badge (one variant per status),
   Input, Nav Item (Default/Active), KPI Card (6 colours), plus layout components App Sidebar and App Navbar.
4. Screens at 1440×900: Login, Dashboard, List page, Detail/Invoice page; mobile 390×844 for the self-service portal.
5. Prototype: Login button → Dashboard; each sidebar item → its screen; "Add" button → modal overlay; portal tabs.
The RTR plugins that build the design are in the `figma/` folder of https://github.com/idgg22026/learn-build-RTR-G2.
