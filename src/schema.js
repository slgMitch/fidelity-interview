const {
    intArg,
    makeSchema,
    nonNull,
    objectType,
    stringArg,
    inputObjectType,
    arg,
  } = require('nexus')

const context = require('./context')
  
  const Query = objectType({
    name: 'Query',
    definition(t) {
      t.nonNull.list.nonNull.field('allAccounts', {
        type: 'Account',
        resolve: (_parent, _args, context) => {
          return context.prisma.account.findMany()
        },
      })
  
      t.nullable.field('contactById', {
        type: 'Contact',
        args: {
          id: intArg(),
        },
        resolve: (_parent, args, context) => {
          return context.prisma.contact.findUnique({
            where: { id: args.id || undefined },
          })
        },
      })
    },
  })
  
  const Mutation = objectType({
    name: 'Mutation',
    definition(t) {
      t.nonNull.field('createAccount', {
        type: 'account',
        args: {
          data: nonNull(
            arg({
              type: 'AccountCreateInput',
            }),
          ),
        },
        resolve: (_, args, context) => {
          const contactData = args.data.contacts
            ? args.data.contacts.map((contact) => {
                return { 
                    name: contact.name, 
                    email: contact.email, 
                    title: contact.title, 
                    personalAddress: contact.personalAddress, 
                    personalPhoneNumber: contact.personalPhoneNumber, 
                }
              })
            : []
          return context.prisma.user.create({
            data: {
              name: args.data.name,
              email: args.data.email,
              officeAddress: args.data.officeAddress,
              officePhone: args.data.officePhone,
              posts: {
                create: contactData,
              },
            },
          })
        },
      })

      t.field('addContact', {
        type: 'Contact',
        args: {
            data: nonNull(
                arg({
                    type: 'ContactCreateInput'
                })
            ),
            accountEmail: nonNull(stringArg()),
        },
        resolve: (_, args, context) => {
            return context.prisma.contact.create({
                data: {
                    name: args.data.name,
                    email: args.data.email,
                    title: args.data.title,
                    personalAddress: args.data.personalAddress,
                    personalPhoneNumber: args.data.personalPhoneNumber,
                    contactOf: {
                        connect: { email: args.accountEmail },
                    }
                }
            })
        }
      })

      t.field('removeContact', {
        type: 'Contact',
        args: {
            accountEmail: nonNull(stringArg()),
        },
        resolve: (_, args, context) => {
            return context.prisma.contact.update({
                data: {
                    contactOf: {
                        disconnect: { email: args.accountEmail },
                    }
                }
            })
        }
      })
  
      t.field('deleteAccount', {
        type: 'Account',
        args: {
          id: nonNull(intArg()),
        },
        resolve: (_, args, context) => {
          return context.prisma.account.delete({
            where: { id: args.id },
          })
        },
      })

    },
  })

  const Account = objectType({
    name: 'Account',
    definition(t) {
        t.nonNull.int('id')
        t.string('name')
        t.nonNull.string('email')
        t.nonNull.string('officeAddress')
        t.nonNull.string('officePhone')
        t.nonNull.list.nonNull.field('contacts', {
            type: 'Contact',
            resolve: (parent, _, context) => {
                return context.prisma.account.findUnique({
                    where: { id: parent.id || undefined }
                }).contacts()
            }
        })
    }
})

const Contact = objectType({
    name: 'Contact',
    definition(t) {
        t.nonNull.int('id')
        t.string('name')
        t.nonNull.string('email')
        t.nonNull.string('title')
        t.nonNull.string('personalAddress')
        t.nonNull.string('personalPhoneNumber')
        t.field('contactOf', {
            type: 'Account',
            resolve: (parent, _, context) => {
                return context.prisma.contact.findUnique({
                    where: { id: parent.id || undefined },
                }).contactOf()
            }
        })
    }
})

  const AccountUniqueInput = inputObjectType({
    name: 'AccountUniqueInput',
    definition(t) {
        t.int('id')
        t.string('email')
    }
  })

  const ContactUniqueInput = inputObjectType({
    name: 'ContactUniqueInput',
    definition(t) {
        t.int('id')
        t.string('email')
    }
  })

  const ContactCreateInput = inputObjectType({
    name: 'ContactCreateInput',
    definition(t) {
        t.string('name')
        t.nonNull.string('email')
        t.string('title')
        t.string('personalAddress')
        t.string('personalPhoneNumber')
      }
  })

  const AccountCreateInput = inputObjectType({
    name: 'AccountCreateInput',
    definition(t) {
        t.string('name')
        t.nonNull.string('email')
        t.string('officeAddress')
        t.string('officePhone')
        t.list.nonNull.field('contacts', { type: 'ContactCreateInput' })
    }
  })
  
  const schema = makeSchema({
    types: [
      Query,
      Mutation,
      Contact,
      Account,
      AccountUniqueInput,
      ContactUniqueInput,
      ContactCreateInput,
      AccountCreateInput,
    ],
    outputs: {
      schema: __dirname + '/../schema.graphql',
      typegen: __dirname + '/generated/nexus.ts',
    },
    sourceTypes: {
      modules: [
        {
          module: '@prisma/client',
          alias: 'prisma',
        },
      ],
    },
  })
  
  module.exports = {
    schema: schema,
  }