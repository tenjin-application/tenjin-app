import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import type { StepProps } from './types';
import type { Course } from '@shared/types';

// Courses uniquely require their own state, thus we extend a type to better accommodate it.
type CoursesStepProps = StepProps & {
    courses: Course[];
    loading: boolean;
    error: string;
};

export function CoursesStep({ data, update, courses, loading, error }: CoursesStepProps) {
    // We want a state to track the search box.
    const [courseSearch, setCourseSearch] = useState('');

    // Essentially, we narrow down the course results based on the value provided by courseSearch.
    const search = courseSearch.toLowerCase();
    const searchedCourses = courses.filter((course) =>
        course.code.toLowerCase().includes(search) || course.title.toLowerCase().includes(search)
    );

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Select courses</h2>
            <Input 
                label="Search courses:"
                id="search-course-input"
                error={error}
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                type="text"
            />
            {loading ? (
                <p>Courses Loading...</p>
            ) : searchedCourses.length === 0 ? (
                <p className="text-sm text-slate-500">No courses match "{courseSearch}".</p>
            ) : (
                <>
                    <p className="text-slate-900 text-medium">Results found:</p>
                    <div className="max-h-80 overflow-y-auto rounded-lg border-2 border-brand p-2">
                        <ul>
                            {searchedCourses.map((course) => (
                                <li key={course.id} className="px-2 py-2 hover:bg-slate-50">
                                        <Checkbox 
                                            type="checkbox" 
                                            label={`${course.code} - ${course.title}`}
                                            checked={data.courseIds.includes(course.id)}
                                            onChange={() => update({
                                                courseIds: data.courseIds.includes(course.id)
                                                    ? data.courseIds.filter(id => id !== course.id)
                                                    : [...data.courseIds, course.id]
                                            })}
                                        />
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
            {data.courseIds.length > 0 
                ? <p className="text-slate-800">{data.courseIds.length} course(s) selected.</p> 
                : <p className="text-slate-800">No courses selected.<span className="ml-1 text-red-600" aria-hidden="true">*</span>
            </p>}
        </div>
    );
}