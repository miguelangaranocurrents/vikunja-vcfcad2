import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain-text copy of editor content. ProseMirror's default flattens lists into bare lines,
// so list markers the user sees would be lost when the text is pasted elsewhere.

function listItemText(item: ProseMirrorNode, marker: string): string {
	const [first, ...rest] = blocksText(item.content, '\n').split('\n')
	const indent = ' '.repeat(marker.length)
	return [marker + (first ?? ''), ...rest.map(line => line === '' ? '' : indent + line)].join('\n')
}

function listText(list: ProseMirrorNode, ordered: boolean): string {
	const lines: string[] = []
	list.forEach((item, _offset, index) => {
		const marker = ordered ? `${Number(list.attrs.start ?? 1) + index}. ` : '- '
		lines.push(listItemText(item, marker))
	})
	return lines.join('\n')
}

function blockText(node: ProseMirrorNode): string {
	switch (node.type.name) {
		case 'taskList':
			return blocksText(node.content, '\n')
		case 'bulletList':
			return listText(node, false)
		case 'orderedList':
			return listText(node, true)
		case 'taskItem':
			return `- [${node.attrs.checked ? 'x' : ' '}] ${blocksText(node.content, '\n')}`
		case 'listItem':
			return blocksText(node.content, '\n')
		case 'blockquote':
			return blocksText(node.content, '\n\n')
			.split('\n')
			.map(line => line === '' ? '>' : '> ' + line)
			.join('\n')
		case 'heading':
			return '#'.repeat(Number(node.attrs.level ?? 1)) + ' ' + node.textContent
		case 'codeBlock':
			return '```\n' + node.textContent + '\n```'
		default:
			if (node.isTextblock || node.isLeaf) {
				return node.textContent
			}
			return blocksText(node.content, '\n\n')
	}
}

function blocksText(fragment: Fragment, separator: string): string {
	const parts: string[] = []
	fragment.forEach(child => parts.push(blockText(child)))
	return parts.join(separator)
}

export function serializeSliceAsText(slice: Slice): string {
	return blocksText(slice.content, '\n\n')
}
