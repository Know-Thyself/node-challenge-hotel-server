const express = require('express');
const cors = require('cors');
const moment = require('moment');
const validator = require('email-validator');
const bookings = require('./bookings.json');
const fetch = require('node-fetch');
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cors());

const routes = [
	{ route: '/bookings', method: 'GET', returns: 'all bookings' },
	{ route: '/bookings/id', method: 'GET', returns: 'customer profile by id' },
	{
		route: '/bookings/search?date=YYYY-MM-DD',
		method: 'GET',
		returns: 'all bookings spanning the given date',
	},
	{
		route: '/bookings/search?term= your search term',
		method: 'GET',
		returns: 'all bookings matching your search term',
	},
	{ route: '/bookings', method: 'POST', creates: 'a new booking' },
	{ route: '/bookings/id', method: 'DELETE', deletes: 'a booking by id' },
];

app.get('/', (req, res) => {
	res.json({ 'Hotel Booking Server! Ask me for': routes });
});

app.get('/bookings', (req, res) => {
	res.json(bookings);
});

app.post('/bookings', (req, res) => {
	const newBooking = req.body;
	const newBookingWithExistingID = bookings.some(
		(booking) => booking.id === newBooking.id
	);
	if (newBookingWithExistingID) {
		res.status(400).json({
			message: `Booking rejected! A booking with the ID - ${newBooking.id} already exists.`,
		});
	} else if (
		moment(newBooking.checkInDate).isAfter(moment(newBooking.checkOutDate))
	) {
		res.status(400).json({
			message: `Booking rejected! Check in date (${newBooking.checkInDate}) should not be after check out date(${newBooking.checkOutDate}).`,
		});
	} else if (!validator.validate(newBooking.email)) {
		res
			.status(400)
			.json({ message: `${newBooking.email} is not a valid email!` });
	} else if (
		newBooking.id &&
		newBooking.title &&
		newBooking.firstName &&
		newBooking.surname &&
		newBooking.email &&
		newBooking.roomId &&
		newBooking.checkInDate &&
		newBooking.checkOutDate
	) {
		bookings.push(newBooking);
		res.json({ message: `Your booking is successfully confirmed!` });
	} else {
		res.status(400);
		res.json({
			message: 'Booking failed! Please fill all the required fields.',
		});
	}
});

app.get('/bookings/search', (req, res) => {
	if (req.query.date) {
		const searchedDate = moment(req.query.date);
		const searchResult = bookings.filter((booking) => {
			const startDate = moment(booking.checkInDate);
			const endDate = moment(booking.checkOutDate);
			return (
				searchedDate.isBetween(startDate, endDate) ||
				searchedDate.isSame(startDate) ||
				searchedDate.isSame(endDate)
			);
		});
		if (searchResult.length > 0) res.json(searchResult);
		else
			res.status(404).json({
				message: `No booking is found for the date ${req.query.date}!`,
			});
	} else if (req.query.term) {
		const searchTerm = req.query.term;
		const foundBooking = bookings.filter((booking) => {
			const foundInEmail = booking.email.includes(searchTerm);
			const foundInFirstName = booking.firstName
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const foundInSurname = booking.surname
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			return foundInEmail || foundInFirstName || foundInSurname;
		});
		if (foundBooking.length > 0) res.json(foundBooking);
		else
			res.status(404).json({
				message: `Your search for '${searchTerm}' could not be found!`,
			});
	}
});

app.get('/bookings/:id', (req, res) => {
	const id = req.params.id;
	fetch(`https://cyf-react.glitch.me/customers/${id}`)
		.then((response) => response.json())
		.then((data) => {
			res.json(data);
		})
		.catch((err) => console.error(err));
});

app.delete('/bookings/:id', (req, res) => {
	const id = req.params.id;
	const toBeDeleted = bookings.findIndex(
		(booking) => booking.id.toString() === id
	);
	if (id && toBeDeleted) {
		bookings.splice(toBeDeleted, 1);
		res.json({ message: `A booking by the ID ${id} is successfully deleted!` });
	} else
		res
			.status(404)
			.send({ message: `A booking by the ID ${id} does not exist.` });
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
