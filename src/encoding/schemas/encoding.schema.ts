import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EncodingDocument = HydratedDocument<Encoding>;

export const ENCODING_SCHEMA_NAME = 'Encoding';

@Schema({ timestamps: true })
export class Encoding {
  @Prop()
  description: string;

  @Prop({ required: true, enum: [] })
  status: string;

  @Prop()
  foreignId: string;

  @Prop()
  thirdPartyEncoder: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const EncodingSchema = SchemaFactory.createForClass(Encoding);
