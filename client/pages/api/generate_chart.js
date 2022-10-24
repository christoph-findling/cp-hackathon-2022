/*
 *
 * Creates a SVG pie diagram
 * @param {{key: number}[]} // number = percentage, key = title
 *
 */

/* eslint-disable @typescript-eslint/no-var-requires */
export default function handler(req, res) {
	var chart = generateChart(req.body)
	res.status(200).json({ res: chart })
}

function generateChart(data) {
	console.log(data)
	data = JSON.parse(data)
	var fs = require('fs')
	const D3Node = require('d3-node')
	const d3 = require('d3')

	var options = {
		d3Module: d3,
	}
	const d3n = new D3Node(options) // initializes D3 with container element

	// set the dimensions and margins of the graph
	var canvasWidth = 400
	var canvasHeight = 250
	var width = 250
	var height = 250
	var margin = 10
	var fontSize = 22

	var svg = d3n.createSVG(canvasWidth, canvasHeight)

	// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
	var radius = Math.min(width, height) / 2 - margin

	// Create dummy data
	// var data = { a: 9, b: 20, c: 30, d: 8, e: 12 }

	// set the color scale
	var color = d3
		.scaleOrdinal()
		.domain(data)
		.range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56'])

	// Compute the position of each group on the pie:
	var pie = d3.pie().value(function (d) {
		return d.value
	})
	var dataRdy = pie(d3.entries(data))

	// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
	svg
		.selectAll('whatever')
		.data(dataRdy)
		.enter()
		.append('path')
		.attr('d', d3.arc().innerRadius(0).outerRadius(radius))
		.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
		.attr('fill', function (d) {
			return color(d.data.key)
		})
		.attr('stroke', 'black')
		.style('stroke-width', '1px')
		.style('opacity', 0.8)

	svg
		.selectAll('whatever')
		.data(dataRdy)
		.enter()
		.append('text')
		.text(function (d) {
			return d.data.key + ': ' + d.data.value + '%'
		})
		.attr('font-size', fontSize)
		.attr('transform', function (d, index) {
			return 'translate(' + (width + 25) + ',' + (height / 2 - 20 + index * (fontSize + 5)) + ')'
		})

	svg
		.selectAll('whatever')
		.data(dataRdy)
		.enter()
		.append('circle')
		// .style('stroke', 'gray')
		.attr('fill', function (d) {
			return color(d.data.key)
		})
		.attr('r', 10)
		.attr('cx', 0)
		.attr('cy', -8)
		.attr('transform', function (d, index) {
			return 'translate(' + (width + 10) + ',' + (height / 2 - 20 + index * (fontSize + 5)) + ')'
		})

	var string = d3n.svgString()
	// console.log(string)

	// fs.writeFile('./public/charts/chart.svg', string, function (err) {
	//   if (err) {
	//     return console.log(err)
	//   }
	//   console.log('The file was saved!')
	// })

	return string
}
