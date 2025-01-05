const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const { randomUUID } = require('crypto');

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : '',
        database : 'voucher'
    } 
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res)=>{
    res.send('this is working');
})

app.get('/voucher', (req, res)=>{
    db.select('*').from('vouchers').where('status', '=', 'available').orderBy('id', 'asc')
    .then(vouchers => {
        res.json(vouchers);
    });
})

app.get('/used-vouchers', (req, res)=>{
    db.select('*').from('vouchers').where('status', '=', 'used').orderBy('id', 'asc')
    .then(vouchers =>{
        res.json(vouchers);
    })
})

app.get('/sales-value', (req, res)=>{
    db.sum('price').from('vouchers').where('status', '=', 'used')
    .then(sum => {
       res.json(sum[0]);
    });   
})

app.get('/total-sales', (req, res)=>{
    db.count('price').from('vouchers').where('status', '=', 'used')
    .then(count => {
       res.json(count[0]);
    });
})    

app.post('/create-voucher', (req, res) => {
    const { airtime, value, price } = req.body;
    db('vouchers')
    .returning('*')    
    .insert({
        airtime: airtime,
        value: value,
        price: price,
        status: 'available',
        voucher: randomUUID()
    })
    .then(voucher => {
        res.json(voucher[0]);
    })
    .catch(err => res.status(400).json('unable to create voucher'))
})

app.post('/verify', (req, res) => {
    db.select('*').from('vouchers')
    .where('voucher', '=', req.body.voucher)
    .then(voucher => {
        if(voucher){
            res.json(voucher[0]);
        } else{
            res.json('is not valid');
        }   
    })
    .catch(err => res.status(400).json(null));
})

app.post('/some-voucher', (req, res) => {
    const { airtime, value, price } = req.body;
    db.select('*').from('vouchers').where({ airtime, value, price }).orderBy('id', 'asc')
    .then(vouch => {
        res.json(vouch); 
    })
})

app.put('/update-status', (req, res) => {
    const { voucher } = req.body;
    db('vouchers').where({ voucher })
    .update({
        status : 'used'
    })
    .returning('status')
    .then(status => {
        if(status){
            res.json(status);
        } else{
            res.json('is not valid');
        }   
    })
})

app.listen(3000, ()=> {
    console.log('app is running on port 3000')
});