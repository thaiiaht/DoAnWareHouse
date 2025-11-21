import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kiot_c'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.specificType('id', 'char(36)').primary()
      table.string('kiot_name', 255).notNullable()
      table.specificType('type', "ENUM('in', 'out')").notNullable()
      table.integer('capacity').notNullable().defaultTo(50)
      table.integer('current_quantity').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}