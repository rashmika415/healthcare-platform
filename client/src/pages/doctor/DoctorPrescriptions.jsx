import PrescriptionForm from '../../components/doctor/PrescriptionForm';

export default function DoctorPrescriptions() {
  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <div className='max-w-5xl mx-auto'>
        <h1 className='text-2xl font-bold text-gray-800 mb-5'>Doctor Prescriptions</h1>
        <PrescriptionForm />
      </div>
    </div>
  );
}
