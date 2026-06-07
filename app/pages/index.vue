<script setup lang="ts">
import { computed, reactive, ref, shallowRef, onMounted } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { Time, CalendarDate } from '@internationalized/date'

const schema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.preprocess(
    (value) => typeof value === 'string' ? value.trim() : value,
    z.string().regex(/^[0-9]{10}$/, 'กรุณากรอกหมายเลขโทรศัพท์ 10 หลักเท่านั้น')
  ),
  subject: z.string().min(1, 'กรุณากรอกหัวข้อ'),
  message: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(10, 'ข้อความต้องอย่างน้อย 10 ตัวอักษร').optional()
  ),
  productInfo: z.string().optional(),
  serialNumber: z.string().optional(),
  shipTime: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  shipDate: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: undefined,
  productInfo: undefined,
  serialNumber: undefined,
  shipTime: undefined,
  shipDate: undefined
})

const listSubjects = ref([
  'Internship',
  'ProductInfo',
  'General',
  'Other'
])

const internShipTime = shallowRef<{ start: Time; end: Time } | undefined>(undefined)
const internShipDate = shallowRef<{ start: CalendarDate; end: CalendarDate } | undefined>(undefined)

function serializeDateRange(dateRange: { start: CalendarDate; end: CalendarDate } | undefined) {
  if (!dateRange) return undefined
  const format = (date: CalendarDate) =>
    `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

  return {
    start: format(dateRange.start),
    end: format(dateRange.end)
  }
}

function serializeTimeRange(timeRange: { start: Time; end: Time } | undefined) {
  if (!timeRange) return undefined
  const format = (time: Time) =>
    `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}`

  return {
    start: format(timeRange.start),
    end: format(timeRange.end)
  }
}

const isFormValid = computed(() => schema.safeParse(state).success)

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const payload = {
      ...event.data,
      ...(state.subject === 'Internship'
        ? {
            shipTime: serializeTimeRange(internShipTime.value),
            shipDate: serializeDateRange(internShipDate.value)
          }
        : {})
    }

    await $fetch('/api/contact', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'ส่งข้อความสำเร็จ',
      description: 'เราจะติดต่อกลับโดยเร็วที่สุด',
      color: 'success'
    })

    state.firstName = ''
    state.lastName = ''
    state.email = ''
    state.phone = ''
    state.subject = ''
    state.message = undefined
    state.productInfo = undefined
    state.serialNumber = undefined
    state.shipTime = undefined
    state.shipDate = undefined
  } catch (err) {
    console.error('Failed to save contact:', err)
    toast.add({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้', color: 'error' })
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen py-10 px-4 sm:px-6 lg:px-8">
    <UPageSection title="Contact Us" description="กรอกข้อมูลเพื่อส่งข้อความ">
      <UForm :schema="schema" :state="state" @submit="onSubmit" class="max-w-3xl w-full">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <UFormField label="ชื่อจริง" name="firstName">
            <UInput v-model="state.firstName" placeholder="ชื่อจริงของคุณ" />
          </UFormField>

          <UFormField label="นามสกุล" name="lastName">
            <UInput v-model="state.lastName" placeholder="นามสกุลของคุณ" />
          </UFormField>
        </div>

        <UFormField label="อีเมล" name="email" class="mb-5">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" size="lg" />
        </UFormField>

        <UFormField label="โทรศัพท์" name="phone" class="mb-5">
          <UInput v-model="state.phone" type="tel" placeholder="0812345678" size="lg" />
        </UFormField>

        <UFormField label="หัวข้อ" name="subject" class="mb-5">
          <USelectMenu v-model="state.subject" :items="listSubjects" placeholder="เลือกหัวข้อ" />
        </UFormField>

        <div v-if="state.subject === 'ProductInfo'" class="w-full mb-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="ข้อมูลผลิตภัณฑ์" name="productInfo" required>
              <UInput v-model="state.productInfo" placeholder="ข้อมูลผลิตภัณฑ์ที่สนใจ" />
            </UFormField>

            <UFormField label="หมายเลขซีเรียล" name="serialNumber">
              <UInput v-model="state.serialNumber" placeholder="หมายเลขซีเรียลของผลิตภัณฑ์ (ถ้ามี)" />
            </UFormField>
          </div>
        </div>

        <div v-if="state.subject === 'Internship'" class="w-full mb-5 space-y-5">
          <UInputTime range :hour-cycle="24" v-model="internShipTime" label="เวลาที่สะดวกสำหรับการติดต่อ" />
          <UCalendar range v-model="internShipDate" label="วันที่สะดวกสำหรับการติดต่อ" />
        </div>

        <div v-if="state.subject === 'General'" >
          <UFormField label="ข้อความ" name="message" class="mb-3">
            <UTextarea v-model="state.message" :rows="5" placeholder="ใส่ข้อความของคุณที่นี่" class="w-full" />
          </UFormField>
        </div>

        <div class="flex justify-end">
          <UButton type="submit">ส่งข้อความ</UButton>
        </div>
      </UForm>
    </UPageSection>

  </div>
</template>
