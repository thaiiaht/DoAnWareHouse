import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export default class KiotD extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare kiotName: string

  @column()
  declare type: string

  @column()
  declare capacity: number

  @column()
  declare quantity: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  public static assignUuid( kiot_d: KiotD) {
    kiot_d.id = uuidv4()
  }
}