const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const graphql = require('graphql')
const joinMonster = require('join-monster').default

// Connect to database
const { Client } = require('pg')
const client = new Client({
  host: {LOCALHOST},
  user: {USERNAME},
  password: {PASSWORD},
  database: {DATABASE}
})
// client.connect()
client.connect(err => {
    if (err) {
      console.error('connection error', err.stack)
    } else {
      console.log('connected')
    }
  })

// Define the schema
const Car = new graphql.GraphQLObjectType({
    name: 'Car',
    extensions: {
        joinMonster: {
            sqlTable: 'car',
            uniqueKey: 'id'
        }
    },
    fields: () => ({
        id: { type: graphql.GraphQLString},
        name: { type: graphql.GraphQLString},
        manufacturer: { 
            type: Manufacturer,
            extensions:{
                joinMonster:{
                    sqlJoin: (carTable, manufacturerTable, args) => `${carTable}.manufacturer_id = ${manufacturerTable}.id`
                }
            }
        }
    })
});

const Manufacturer = new graphql.GraphQLObjectType({
    name: 'Manufacturer',
    extensions: {
        joinMonster:{
            sqlTable: 'manufacturer',
            uniqueKey: 'id'
        }
    },
    fields: () => ({
        id: { type: graphql.GraphQLString },
        name: { type: graphql.GraphQLString },
        year: { type:graphql.GraphQLString },
        cars: {
            type: graphql.GraphQLList(Car),
            extensions: {
                joinMonster: {
                    sqlJoin: (manufacturerTable, carTable, args) => `${manufacturerTable}.id = ${carTable}.manufacturer_id`
                }
            }
        }
    })
})

// Manufacturer._typeConfig = {
//   sqlTable: 'manufacturer',
//   uniqueKey: 'id'
// }

const QueryRoot = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    hello: {
      type: graphql.GraphQLString,
      resolve: () => "Hello world!"
    },
    cars: {
        type: new graphql.GraphQLList(Car),
        resolve: (parent, args, context, resolveInfo) => {
            return joinMonster(resolveInfo, {}, sql => {
                return client.query(sql)
            })
        }
    },
    car: {
        type: Car,
        args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLString) } },
        where: (carTable, args, context) => `${carTable}.id = ${args.id}`,
        resolve: (parent, args, context, resolveInfo) => {
            return joinMonster(resolveInfo, {}, sql => {
                return client.query(sql)
            })
        }
    },
    manufacturers: {
        type: new graphql.GraphQLList(Manufacturer),
        resolve: (parent, args, context, resolveInfo) => {
            return joinMonster.default(resolveInfo, {}, sql => {
                return client.query(sql)
            })
        }
    },
    manufacturer: {
        type: Manufacturer,
        args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLString) } },
        where: (manufacturerTable, args, context) => `${manufacturerTable}.id = ${args.id}`,
        resolve: (parent, args, context, resolveInfo) => {
            return joinMonster.default(resolveInfo, {}, sql => {
                return client.query(sql)
            })
        }
    },
  })
})

const schema = new graphql.GraphQLSchema({
  query: QueryRoot
});

// Create the Express app
const app = express();
app.use('/api', graphqlHTTP({
  schema: schema,
  graphiql: true
}));
app.listen(4000);