import { readFileSync } from 'node:fs'

import ts from 'typescript'

/** Derive coverage from the authenticated Routes, so a new route joins every gate. */
export function authenticatedRoutes() {
  const text = readFileSync('src/App.tsx', 'utf8')
  const source = ts.createSourceFile(
    'App.tsx',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  /** @type {Array<{path: string, screens: string[]}>} */
  const routes = []
  function walk(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(source) === 'Routes' &&
      node.getText(source).includes("path='/today'")
    ) {
      function routeWalk(child) {
        if (
          ts.isJsxSelfClosingElement(child) &&
          child.tagName.getText(source) === 'Route'
        ) {
          const path = child.attributes.properties.find(
            p => p.name?.getText(source) === 'path',
          )?.initializer
          if (path && ts.isStringLiteral(path) && path.text !== '*') {
            const screens = [
              ...child.getText(source).matchAll(/<(\w+(?:Screen|Home))\b/g),
            ].map(m => m[1])
            routes.push({ path: path.text, screens })
          }
        }
        ts.forEachChild(child, routeWalk)
      }
      routeWalk(node)
      return
    }
    ts.forEachChild(node, walk)
  }
  walk(source)
  if (!routes.length) throw new Error('Authenticated route table was not found')
  return routes
}

const utilityRoutes = new Set([
  '/error',
  '/offline',
  '/unavailable',
  '/permission-denied',
])
export const primaryRoutes = () =>
  authenticatedRoutes().filter(route => !utilityRoutes.has(route.path))
