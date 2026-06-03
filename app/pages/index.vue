<script setup lang="ts">
import { computed, reactive } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.preprocess(
    (value) => typeof value === 'string' ? value.trim() : value,
    z.string().regex(/^[0-9]{10}$/, 'กรุณากรอกหมายเลขโทรศัพท์ 10 หลักเท่านั้น')
  ),
  subject: z.string().min(1, 'กรุณากรอกหัวข้อ'),
  message: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(10, 'ข้อความต้องอย่างน้อย 10 ตัวอักษร').optional()
  )
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: undefined
})

const isFormValid = computed(() => schema.safeParse(state).success)

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'ส่งข้อความสำเร็จ',
      description: 'เราจะติดต่อกลับโดยเร็วที่สุด',
      color: 'success'
    })

    state.name = ''
    state.email = ''
    state.phone = ''
    state.subject = ''
    state.message = undefined
  } catch (err) {
    console.error('Failed to save contact:', err)
    toast.add({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้', color: 'error' })
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen py-10 px-4 sm:px-6 lg:px-8">
    <!-- <UPageHero
      title="Contact Us"
      description="Contact Us"
    /> -->

    <UPageSection title="Contact Us" description="กรอกข้อมูลเพื่อส่งข้อความ">
      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-5 max-w-3xl">
        <UFormField label="ชื่อ" name="name">
          <UInput v-model="state.name" placeholder="ชื่อของคุณ" />
        </UFormField>

        <UFormField label="อีเมล" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" />
        </UFormField>

        <UFormField label="โทรศัพท์" name="phone">
          <UInput v-model="state.phone" type="tel" placeholder="0812345678" />
        </UFormField>

        <UFormField label="หัวข้อ" name="subject">
          <UInput v-model="state.subject" placeholder="หัวข้อเรื่อง" />
        </UFormField>

        <UFormField label="ข้อความ" name="message">
          <UTextarea v-model="state.message" :rows="5" placeholder="ใส่ข้อความของคุณที่นี่" />
        </UFormField>

        <div class="flex justify-end">
          <UButton type="submit" :disabled="!isFormValid">ส่งข้อความ</UButton>
        </div>
      </UForm>
    </UPageSection>
    
  </div>
</template>
